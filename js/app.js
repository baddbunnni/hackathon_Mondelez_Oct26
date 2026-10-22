/*
 * fieldwork UI controller. Renders the landing page, the four-question flow and
 * the results. State lives only in memory: nothing is persisted or sent anywhere.
 */
(function () {
  'use strict';

  const D = window.FutureBiteData;
  const R = window.FutureBiteRules;
  const app = document.getElementById('app');
  const announcer = document.getElementById('announcer');

  const STEP_NAMES = ['Interests', 'Your situation', 'Experience', 'Your goal'];
  const ANSWER_FIELDS = ['interests', 'stage', 'age', 'experience', 'goal'];

  const blankAnswers = () => ({ interests: [], stage: null, age: null, experience: null, goal: null });
  const state = { step: 0, answers: blankAnswers(), pick: null, move: null, spots: [], editing: false, error: '' };

  // ---------- Icons (original line icons) ----------
  const ICONS = {
    gear: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2.6-1.5L14 2.6h-4l-.5 2.5a7.5 7.5 0 0 0-2.6 1.5l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2.6 1.5l.5 2.5h4l.5-2.5a7.5 7.5 0 0 0 2.6-1.5l2.3 1 2-3.4Z"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    flow: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6h9M6.5 8.2l4 7.5M17.5 8.2l-4 7.5"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z"/><path d="M5 19 13 11"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    blueprint: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16M12 13h6M12 16h4"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17Z"/><path d="M7 17h2M12 17h2"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    check: '<path d="M4 12.5 9.5 18 20 6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    restart: '<path d="M4 4v6h6"/><path d="M4.5 15a8 8 0 1 0 1.9-8.3L4 10"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>'
  };
  const icon = (name, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${ICONS[name]}</svg>`;
  const tick = '<span class="option__tick">' + icon('check', 'stroke-width="3"') + '</span>';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Landing ----------
  const factorySvg = `
    <svg viewBox="0 0 400 250" role="img" aria-labelledby="factory-title">
      <title id="factory-title">Illustration: a snack production line with an oven, a robot arm and biscuits moving along a conveyor belt</title>
      <rect x="0" y="0" width="400" height="250" rx="20" fill="#eaf0e4"/>
      <g class="gear-spin"><circle cx="58" cy="58" r="24" fill="none" stroke="#173f32" stroke-width="8" stroke-dasharray="7 5"/><circle cx="58" cy="58" r="10" fill="#ff6b35"/></g>
      <rect x="110" y="70" width="110" height="80" rx="10" fill="#173f32"/>
      <rect x="124" y="86" width="82" height="34" rx="6" fill="#ff6b35"/>
      <path d="M136 103c6-8 12 8 18 0s12 8 18 0 12 8 18 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="132" cy="136" r="4" fill="#dded9f"/><circle cx="146" cy="136" r="4" fill="#fff"/>
      <text x="165" y="141" fill="#fff" font-family="Inter, sans-serif" font-size="10" font-weight="600">OVEN 180°</text>
      <rect x="292" y="20" width="60" height="16" rx="6" fill="#205f46"/>
      <g class="arm"><rect x="314" y="34" width="12" height="62" rx="6" fill="#205f46" transform="rotate(10 320 34)"/><circle cx="310" cy="96" r="9" fill="#ff6b35"/><path d="M302 104l-6 14M318 104l6 14" stroke="#173f32" stroke-width="5" stroke-linecap="round"/></g>
      <rect x="20" y="182" width="360" height="16" rx="8" fill="#173f32"/>
      <circle cx="34" cy="190" r="5" fill="#ff6b35"/><circle cx="366" cy="190" r="5" fill="#ff6b35"/>
      <rect x="40" y="198" width="8" height="34" fill="#205f46"/><rect x="352" y="198" width="8" height="34" fill="#205f46"/>
      <g>
        <g class="belt-item"><circle cx="20" cy="170" r="13" fill="#c98a4b"/><circle cx="15" cy="166" r="2" fill="#5a3a22"/><circle cx="24" cy="172" r="2" fill="#5a3a22"/><circle cx="17" cy="175" r="1.6" fill="#5a3a22"/></g>
        <g class="belt-item"><rect x="2" y="160" width="40" height="20" rx="4" fill="#5a2f1e"/><path d="M12 160v20M22 160v20M32 160v20" stroke="#7a4430" stroke-width="2"/></g>
        <g class="belt-item"><circle cx="20" cy="170" r="13" fill="#2b1a12"/><circle cx="20" cy="170" r="8" fill="none" stroke="#fff" stroke-width="2"/></g>
        <g class="belt-item"><rect x="4" y="158" width="34" height="22" rx="5" fill="#dded9f"/><rect x="10" y="164" width="22" height="10" rx="3" fill="#fff"/></g>
      </g>
      <rect x="250" y="226" width="130" height="16" rx="8" fill="#dded9f"/>
      <text x="262" y="238" fill="#173f32" font-family="Inter, sans-serif" font-size="10" font-weight="700">QUALITY CHECK ✓</text>
    </svg>`;

  function renderLanding() {
    const pillars = [
      ['gear', 'Fix it', 'A machine stops mid-shift. Someone has to work out why and get it going again.'],
      ['chip', 'Automate it', 'Robots and sensors check, pick and pack. Someone has to set them up.'],
      ['flow', 'Improve it', 'One batch comes out different. Someone has to find out why.'],
      ['leaf', 'Waste less of it', 'Less packaging and less energy. Someone has to design that.']
    ];
    return `
      <div class="wrap">
        <section class="hero" aria-labelledby="page-title">
          <div>
            <span class="eyebrow">Careers in food manufacturing</span>
            <h1 id="page-title" tabindex="-1">Discover the careers behind the snacks you know.</h1>
            <p class="lede">Behind every biscuit, chocolate bar and packet of crisps there are machines to fix, robots to program and processes to improve. Could one of those jobs be yours?</p>
            <p class="lede">Answer 4 quick questions to get a career to explore and your next move: real searches, a checklist and skills you already have.</p>
            <div class="hero__cta">
              <button class="btn btn--primary btn--big" type="button" data-action="start">Discover your pathway ${icon('arrow')}</button>
            </div>
            <p class="hero__note">${icon('compass')} About a minute · no sign-up · nothing stored. You don\u2019t need a degree or work experience to start.</p>
          </div>
          <div class="factory">
            <span class="factory__pill">This is engineering in food</span>
            ${factorySvg}
          </div>
        </section>
      </div>
      <section class="band" aria-labelledby="pillars-title">
        <div class="wrap band__inner">
          <h2 id="pillars-title">Food factories need people who\u2026</h2>
          ${pillars.map(([ic, t, d]) => `
            <article class="pillar">
              ${icon(ic)}
              <div>
                <h3>${t}</h3>
                <p>${d}</p>
              </div>
            </article>`).join('')}
        </div>
      </section>`;
  }

  // ---------- Questions ----------
  function progress(step) {
    return `
      <div class="progress">
        <p class="progress__label">Step ${step} of 4 · ${STEP_NAMES[step - 1]}</p>
        <ol class="progress__steps" aria-hidden="true">
          ${STEP_NAMES.map((n, i) => `<li class="${i + 1 < step ? 'is-done' : i + 1 === step ? 'is-current' : ''}">${n}</li>`).join('')}
        </ol>
      </div>`;
  }

  function optionsHtml(name, list, type, selected, opts = {}) {
    return list.map(o => {
      const checked = type === 'checkbox' ? selected.includes(o.id) : selected === o.id;
      const id = `${name}-${o.id}`;
      return `
        <label class="option option--${type}" for="${id}">
          <input type="${type}" id="${id}" name="${name}" value="${o.id}" ${checked ? 'checked' : ''}>
          ${tick}
          <span class="option__body">
            <span class="option__title">${o.icon ? icon(o.icon) : ''}${esc(o.label)}</span>
            ${opts.showLink && o.link ? `<span class="option__link">${esc(o.link)}</span>` : ''}
          </span>
        </label>`;
    }).join('');
  }

  function questionHtml(step) {
    const a = state.answers;
    switch (step) {
      case 1:
        return `
          <fieldset class="question">
            <legend><h2 id="q-title" tabindex="-1">What sounds interesting to you?</h2></legend>
            <p class="question__hint">Pick as many as you like.</p>
            <div class="options">${optionsHtml('interests', D.INTERESTS, 'checkbox', a.interests, { showLink: true })}</div>
          </fieldset>`;
      case 2:
        return `
          <fieldset class="question">
            <legend><h2 id="q-title" tabindex="-1">Where are you right now?</h2></legend>
            <p class="question__hint">Choose the one closest to you.</p>
            <div class="options">${optionsHtml('stage', D.STAGES, 'radio', a.stage)}</div>
          </fieldset>
          ${a.stage === 'school' ? `
            <fieldset class="question subquestion">
              <legend><h3>Are you aged 14–19?</h3></legend>
              <p class="question__hint">Optional. One programme has an age limit. We don’t store this.</p>
              <div class="options">${optionsHtml('age', D.AGE_OPTIONS, 'radio', a.age)}</div>
            </fieldset>` : ''}`;
      case 3:
        return `
          <fieldset class="question">
            <legend><h2 id="q-title" tabindex="-1">Have you done any hands-on or technical work before?</h2></legend>
            <p class="question__hint">Paid or unpaid. Fixing bikes or cars, building a PC, DIY, a trade or a technical project all count. <strong>“Not yet” is completely fine. Everyone starts somewhere.</strong></p>
            <div class="options options--two">${optionsHtml('experience', D.EXPERIENCE_OPTIONS, 'radio', a.experience)}</div>
          </fieldset>`;
      case 4:
        return `
          <fieldset class="question">
            <legend><h2 id="q-title" tabindex="-1">What would help you most right now?</h2></legend>
            <p class="question__hint">Choose the one that fits best.</p>
            <div class="options">${optionsHtml('goal', R.goalsFor(a.stage), 'radio', a.goal)}</div>
          </fieldset>`;
    }
    return '';
  }

  function renderStep(step) {
    return `
      <section class="wizard" aria-labelledby="q-title">
        ${progress(step)}
        <form id="q-form" novalidate>
          ${questionHtml(step)}
          <p class="error" id="q-error" role="alert">${esc(state.error)}</p>
          <div class="nav">
            <button class="btn btn--ghost" type="button" data-action="back">${icon('back')} Back</button>
            <span class="nav__right">
              ${state.editing && step < 4 ? `<button class="btn btn--ghost" type="button" data-action="results">See updated results</button>` : ''}
              <button class="btn btn--primary" type="submit">${step === 4 ? 'Show my pathway' : 'Next'} ${icon('arrow')}</button>
            </span>
          </div>
        </form>
      </section>`;
  }

  function validate(step) {
    const a = state.answers;
    if (step === 1 && a.interests.length === 0) return 'Pick at least one, or choose “Not sure yet”.';
    if (step === 2 && !a.stage) return 'Choose the option closest to where you are now.';
    if (step === 3 && !a.experience) return 'Choose one. “Not yet” is fine.';
    if (step === 4 && !a.goal) return 'Choose what would help you most.';
    return '';
  }

  // ---------- Results ----------
  // Placeholder only: the "day in the life" stories aren't written yet, so it does nothing.
  const dayInLife = title => `
    <button type="button" class="dil" aria-disabled="true" title="Coming soon">
      ${icon('play')} A day in the life<span class="visually-hidden"> of ${esc(title)}</span>
      <span class="soon">Coming soon</span>
    </button>`;

  const linkTag = type => `<span class="ltype ltype--${type}">${esc(D.LINK_TYPES[type])}</span>`;

  function nextMoveHtml(r, move) {
    const { career, action } = move;
    const options = [r.actions.primary, ...r.actions.alternatives];
    return `
      <section class="section move" aria-labelledby="move-title">
        <span class="eyebrow">02 / What happens next</span>
        <h2 id="move-title" tabindex="-1">Your next move</h2>
        <p class="move__career">For <strong>${esc(career.area.title)}</strong>. ${esc(career.why)}
          <button class="linkbtn" type="button" data-action="to-careers">Change career</button></p>

        <fieldset class="question move__choose">
          <legend><h3>What do you want to do next?</h3></legend>
          <div class="options options--three">
            ${options.map(id => {
              const label = R.buildAction(id, state.answers, r.profile, career.area).label;
              return `
                <label class="option option--radio" for="move-${id}">
                  <input type="radio" id="move-${id}" name="move" value="${id}" ${id === action.id ? 'checked' : ''}>
                  ${tick}
                  <span class="option__body">
                    <span class="option__title">${esc(label)}</span>
                    ${id === r.actions.primary ? '<span class="rec">Recommended for you</span>' : ''}
                  </span>
                </label>`;
            }).join('')}
          </div>
        </fieldset>

        <article class="card plan" aria-labelledby="plan-title">
          <h3 id="plan-title">${esc(action.title)}</h3>
          <p class="plan__why"><strong>Why this step:</strong> ${esc(action.why)}</p>

          ${action.spotter ? `
            <fieldset class="spotter">
              <legend><h4>Things you’ve done (tick any)</h4></legend>
              <ul>
                ${D.SKILL_SPOTTER.map(s => `
                  <li><label><input type="checkbox" name="spot" id="spot-${s.id}" value="${s.id}" ${state.spots.includes(s.id) ? 'checked' : ''}>
                    <span>${esc(s.label)}</span></label>
                    ${state.spots.includes(s.id) ? `<p class="spotter__skill">${icon('star')} You can talk about: <strong>${esc(s.skill)}</strong></p>` : ''}
                  </li>`).join('')}
              </ul>
              <p class="spotter__caveat">${esc(action.caveat)}</p>
            </fieldset>` : ''}

          <h4>Where to go</h4>
          <ul class="olinks">
            ${action.links.map(l => `
              <li>
                ${linkTag(l.type)}
                <a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ${icon('external')}<span class="visually-hidden"> (opens in a new tab)</span></a>
                <p><strong>After you click:</strong> ${esc(l.after)}</p>
              </li>`).join('')}
          </ul>

          <h4>Your checklist</h4>
          <ul class="tasks">
            ${action.tasks.map((t, i) => `
              <li><label><input type="checkbox" name="task" id="task-${i}"><span>${esc(t)}</span></label></li>`).join('')}
          </ul>
        </article>
      </section>`;
  }

  function renderResults() {
    const r = R.recommend(state.answers);
    const all = [r.primaryCareer].concat(r.altCareers);
    const move = r.nextMove(state.pick, state.move);
    const main = move.career;
    const alts = all.filter(c => c !== main);

    return `
      <section class="results" aria-labelledby="results-title">
        <div class="results__head">
          <div>
            <span class="eyebrow">${esc(r.profileLabel)}</span>
            <h1 id="results-title" tabindex="-1">Your fieldwork pathway</h1>
            <p class="muted">A starting point to explore, not an assessment of what you can do or what you’re eligible for.</p>
          </div>
          <div class="results__actions">
            <button class="btn btn--ghost" type="button" data-action="edit" data-step="1">${icon('edit')} Change answers</button>
            <button class="btn btn--ghost" type="button" data-action="restart">${icon('restart')} Restart</button>
          </div>
        </div>

        <section class="section" aria-labelledby="match-title">
          <span class="eyebrow">01 / Your career match</span>
          <h2 id="match-title" tabindex="-1">A career that could suit you</h2>
          <article class="card match">
            <div class="match__head">
              <div class="icon-badge icon-badge--lg">${icon(main.area.icon)}</div>
              <div>
                <h3>${esc(main.area.title)}</h3>
                <p class="match__everyday">${esc(main.area.everyday)}</p>
              </div>
            </div>
            <p class="why"><strong>Why it could suit you:</strong> ${esc(main.why)}</p>
            <div class="match__cols">
              <div>
                <h4>Problems you might help solve <span class="tag">Illustrative</span></h4>
                <ul>${main.area.problems.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
              </div>
              <div>
                <h4>Why it matters</h4>
                <p>${esc(main.area.matters)}</p>
              </div>
            </div>
            ${dayInLife(main.area.title)}
          </article>

          ${alts.length ? `
          <h3 class="alts__title" id="alts-title" tabindex="-1">Other careers you might like</h3>
          <div class="alts">
            ${alts.map(c => `
              <article class="card alt">
                <div class="alt__head"><div class="icon-badge">${icon(c.area.icon)}</div><h4>${esc(c.area.title)}</h4></div>
                <p>${esc(c.area.everyday)}</p>
                <div class="alt__actions">
                  <button class="linkbtn" type="button" data-action="pick" data-career="${c.area.id}">${icon('star')} Make this my top pick</button>
                  ${dayInLife(c.area.title)}
                </div>
              </article>`).join('')}
          </div>` : ''}
        </section>

        ${nextMoveHtml(r, move)}

        <div class="legend" aria-label="What the link labels mean">
          ${linkTag('search')} ${linkTag('info')} ${linkTag('employer')} ${linkTag('programme')}
        </div>
      </section>`;
  }

  // ---------- Render + events ----------
  function render(focusId) {
    const s = state.step;
    app.innerHTML = s === 0 ? renderLanding() : `<div class="wrap">${s === 5 ? renderResults() : renderStep(s)}</div>`;
    const target = (focusId && document.getElementById(focusId)) ||
      document.getElementById(s === 0 ? 'page-title' : s === 5 ? 'results-title' : 'q-title');
    if (target) target.focus({ preventScroll: !!focusId });
  }

  function go(step) {
    state.step = step;
    state.error = '';
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
    announcer.textContent = step === 0 ? 'Home' : step === 5 ? 'Your fieldwork pathway' : `Step ${step} of 4: ${STEP_NAMES[step - 1]}`;
  }

  app.addEventListener('change', e => {
    const el = e.target;
    if (el.name === 'move') { state.move = el.value; render(el.id); announcer.textContent = 'Next move updated'; return; }
    if (el.name === 'spot') {
      state.spots = el.checked ? state.spots.concat(el.value) : state.spots.filter(s => s !== el.value);
      render(el.id);
      return;
    }
    if (!ANSWER_FIELDS.includes(el.name)) return; // e.g. the results checklist
    const a = state.answers;
    if (el.name === 'interests') {
      if (el.value === 'unsure') a.interests = el.checked ? ['unsure'] : [];
      else {
        const set = new Set(a.interests.filter(i => i !== 'unsure'));
        el.checked ? set.add(el.value) : set.delete(el.value);
        a.interests = D.INTERESTS.map(i => i.id).filter(id => set.has(id));
      }
    } else if (el.name === 'stage') {
      a.stage = el.value;
      if (a.stage !== 'school') a.age = null;
      if (a.goal && !R.goalsFor(a.stage).some(g => g.id === a.goal)) a.goal = null;
    } else {
      a[el.name] = el.value;
    }
    state.pick = null;
    state.move = null;
    state.error = '';
    render(el.id);
  });

  app.addEventListener('submit', e => {
    e.preventDefault();
    const err = validate(state.step);
    if (err) {
      state.error = err;
      document.getElementById('q-error').textContent = err;
      return;
    }
    go(state.step + 1);
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'start') { state.editing = false; go(1); }
    else if (action === 'back') go(state.step - 1);
    else if (action === 'home') go(0);
    else if (action === 'edit') { state.editing = true; go(Number(btn.dataset.step)); }
    else if (action === 'pick') {
      state.pick = btn.dataset.career;
      render('match-title');
      document.getElementById('match-title').scrollIntoView({ block: 'start' });
      announcer.textContent = 'Top pick updated. Your Next Move now matches it.';
    }
    else if (action === 'to-careers') {
      const t = document.getElementById('alts-title') || document.getElementById('match-title');
      t.focus({ preventScroll: true });
      t.scrollIntoView({ block: 'start' });
    }
    else if (action === 'results') {
      for (let s = 1; s <= 4; s++) {
        if (validate(s)) { go(s); document.getElementById('q-error').textContent = validate(s); return; }
      }
      go(5);
    }
    else if (action === 'restart') { Object.assign(state, { answers: blankAnswers(), pick: null, move: null, spots: [], editing: false }); go(0); }
  });

  // First paint: no forced focus, so screen readers start at the top of the page.
  app.innerHTML = renderLanding();
})();
