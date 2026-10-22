/*
 * fieldwork rules engine.
 * Deterministic and transparent: every decision adds a plain-English entry to
 * `reasons`. No network calls, no AI API, nothing stored.
 *
 * Answers: { interests: [], stage, age, experience, goal }
 * Experience is only ever taken from what the user says. It is never inferred
 * from age, qualifications or not being in education. Eligibility and vacancy
 * status are never inferred at all.
 */
(function (root) {
  'use strict';

  const D = root.FutureBiteData || (typeof require !== 'undefined' ? require('./data.js') : null);
  const S = D.SOURCES;

  const PROFILES = {
    starter: 'Looking for a way in',
    practical: 'Hands-on experience, looking for a way in',
    school: 'At school or college',
    university: 'At university',
    graduate: 'Graduate',
    unsure: 'Still working it out'
  };

  // Actions each profile can see, in order of usefulness. The first two that
  // aren't the recommended action become the alternatives.
  const ACTION_ORDER = {
    starter: ['apprenticeships', 'jobs', 'qualifications', 'skills', 'explore'],
    practical: ['jobs', 'apprenticeships', 'qualifications', 'skills', 'explore'],
    school: ['experience', 'apprenticeships', 'qualifications', 'explore', 'skills'],
    university: ['placements', 'jobs', 'skills', 'explore'],
    graduate: ['jobs', 'placements', 'skills', 'explore'],
    unsure: ['explore', 'skills', 'qualifications', 'apprenticeships']
  };

  const GOAL_TO_ACTION = {
    discover: 'explore', jobs: 'jobs', earn: 'apprenticeships', training: 'qualifications',
    experience: 'experience', internship: 'placements', graduate: 'jobs'
  };

  function labelOf(list, id) {
    const item = list.find(x => x.id === id);
    return item ? item.label : id;
  }

  function goalsFor(stage) {
    return D.GOALS.filter(g => g.stages.includes(stage || 'unsure'));
  }

  // Rule set 1: who is this person. Stage first; experience only when stated.
  function determineProfile(a, reasons) {
    const say = (id, text) => reasons.push({ id, text });
    const saidExperience = a.experience === 'yes';

    switch (a.stage) {
      case 'graduate':
        say('P1', 'You’ve finished a degree, so we included graduate roles.');
        return 'graduate';
      case 'university':
        say('P2', 'You’re at university, so we looked at placements and graduate roles.');
        return 'university';
      case 'school':
        say('P3', 'You’re at school or college, so we looked at options for students.');
        return 'school';
      case 'exploring':
        if (saidExperience) {
          say('P4', 'You’re not studying right now and you told us you’ve done hands-on or technical work.');
          return 'practical';
        }
        say('P5', 'You’re not studying right now and looking for a way in. We didn’t assume any work experience.');
        return 'starter';
      default:
        if (saidExperience) {
          say('P6', 'You’re not sure where you are yet, but you told us you’ve done hands-on or technical work.');
          return 'practical';
        }
        say('P7', 'You’re still working things out, so we started with low-pressure steps.');
        return 'unsure';
    }
  }

  // Rule set 2: career areas scored from interests. The top one is the main match.
  function scoreCareers(a, profile, reasons) {
    const picked = (a.interests || []).filter(i => i !== 'unsure');
    const handsOn = profile === 'starter' || profile === 'practical';

    if (picked.length === 0) {
      const ids = handsOn ? D.HANDS_ON_STARTER_AREAS : D.STARTER_AREAS;
      reasons.push({ id: 'C1', text: 'You weren’t sure about your interests yet, so we picked a broad mix to explore.' });
      return ids.map(id => ({
        area: D.CAREER_AREAS.find(c => c.id === id), score: 0, matched: [],
        why: 'It’s a good place to start exploring. You don’t need to know what you like yet.'
      }));
    }

    const scored = D.CAREER_AREAS.map((area, order) => {
      let score = 0;
      const matched = [];
      picked.forEach(i => {
        if (area.weights[i]) { score += area.weights[i]; matched.push(i); }
      });
      // Hands-on routes into food factories often start in operations, so give it
      // a nudge when it already matches.
      if (handsOn && area.id === 'operations' && score > 0) score += 1;
      return { area, score, matched, order };
    });

    scored.sort((x, y) => y.score - x.score || x.order - y.order);
    const top = scored.filter(s => s.score > 0).slice(0, 3);

    reasons.push({
      id: 'C2',
      text: 'We matched career areas to your interests (' +
        picked.map(i => labelOf(D.INTERESTS, i).toLowerCase()).join('; ') + ').'
    });

    return top.map(s => {
      const ordered = s.matched.slice().sort((x, y) => s.area.weights[y] - s.area.weights[x]);
      const clauses = ordered.slice(0, 2).map(i => s.area.because[i]);
      return { area: s.area, score: s.score, matched: s.matched, why: 'Because ' + clauses.join(', and ') + '.' };
    });
  }

  // Rule set 3: which next actions to offer. One recommended, at most two alternatives.
  function chooseActions(a, profile, reasons) {
    let order = ACTION_ORDER[profile].slice();
    // RWEX is the only work-experience programme we can point to, and it's for 14–19s.
    if (profile === 'school' && a.age === 'no') order = order.filter(x => x !== 'experience');

    const defaults = {
      starter: 'skills', practical: 'jobs', school: order.includes('experience') ? 'experience' : 'explore',
      university: 'placements', graduate: 'jobs', unsure: 'explore'
    };

    let primary = GOAL_TO_ACTION[a.goal] || defaults[profile];
    if (!order.includes(primary)) {
      reasons.push({ id: 'A1', text: 'The goal you picked doesn’t fit your situation yet, so we suggested a step that does.' });
      primary = defaults[profile];
    } else if (!GOAL_TO_ACTION[a.goal]) {
      reasons.push({ id: 'A2', text: profile === 'starter'
        ? 'You weren’t sure where to start, so we began with something you can do today: spotting the skills you already have.'
        : 'You weren’t sure where to start, so we suggested the step that fits your situation best.' });
    } else {
      reasons.push({ id: 'A3', text: 'You said you want to: ' + labelOf(D.GOALS, a.goal).toLowerCase() + '.' });
    }

    const alternatives = order.filter(x => x !== primary).slice(0, 2);
    return { primary, alternatives };
  }

  // What each action contains for this person and career. Every link says what to
  // do after clicking it, and no link claims anything is open.
  function buildAction(id, a, profile, area) {
    const name = area.title.toLowerCase();
    const graduateLevel = profile === 'graduate' || profile === 'university';
    const noExperience = a.experience !== 'yes';
    const ncs = area.ncs.map(([slug, label]) => S.ncsProfile(slug, label));
    const adviserTask = `Ask a careers adviser or teacher: “What would help me get into ${name}?”`;
    const checkListing = 'Listings change every day, so open each one to check it’s still open and what it asks for.';

    switch (id) {
      case 'skills':
        return {
          id, label: 'Spot the skills you already have',
          title: 'Spot the skills you already have',
          why: noExperience
            ? 'You don’t need a job history to have skills. Naming them now makes every next step easier, whether that’s an application, a course or a chat with an adviser.'
            : 'You’ve done hands-on work. Putting it into words makes applications and conversations much easier.',
          spotter: true,
          caveat: 'These are skills you can talk about. On their own they don’t meet a job’s formal requirements, so always check what each listing asks for.',
          links: [Object.assign({ after: 'Answer the questions, then compare what it finds with your list here.' }, S.ncsSkills)],
          tasks: [
            'Tick at least two things above that you’ve done.',
            'Write one sentence: “When I ___, I ___, which shows I can ___.”',
            adviserTask
          ]
        };

      case 'jobs': {
        const term = graduateLevel ? 'graduate ' + area.search.role : (profile === 'practical' ? area.search.role : area.search.entry);
        const links = [Object.assign({ after: 'Add your town or postcode on the site, then open 2–3 listings and note what they ask for. ' + checkListing }, S.workHub(term))];
        if (graduateLevel) links.push(Object.assign({ after: 'Published information about one employer’s scheme. It doesn’t mean places are open now. ' + D.PROGRAMMES.graduate.facts }, S.mdlzEarlyCareers, { label: D.PROGRAMMES.graduate.title }));
        return {
          id, label: graduateLevel ? 'Find graduate roles' : 'Find jobs and entry-level roles',
          title: graduateLevel ? `Look for graduate ${name} roles` : `Look for ${profile === 'practical' ? '' : 'entry-level '}${name} roles`,
          why: graduateLevel
            ? 'You’ve got (or are finishing) a degree, so graduate roles and schemes are worth comparing.'
            : profile === 'practical'
              ? 'You’ve done hands-on work, so roles like this may be within reach. Each listing sets its own requirements.'
              : 'Trainee and entry-level roles are one way into food manufacturing. Each listing sets its own requirements, so read them carefully.',
          links,
          tasks: [
            'Save two listings that look interesting.',
            'Write down any requirement that comes up more than once.',
            noExperience ? 'Note which requirements you already meet, and one to work on.' : 'Match one of your hands-on experiences to a requirement.'
          ]
        };
      }

      case 'apprenticeships': {
        const links = [
          Object.assign({ after: 'Add your location, then open a listing and read its requirements and closing date. ' + checkListing }, S.apprenticeships(area.search.apprenticeship)),
          Object.assign({ after: 'Read how apprenticeships work, including levels, pay and what to expect.' }, S.becomeApprentice)
        ];
        if (profile !== 'university' && profile !== 'graduate') {
          links.push(Object.assign({ after: 'Published information about one employer’s apprenticeships. It doesn’t mean places are open now. ' + D.PROGRAMMES.apprenticeship.facts }, S.mdlzEarlyCareers, { label: D.PROGRAMMES.apprenticeship.title }));
        }
        return {
          id, label: 'Explore apprenticeships (earn while you learn)',
          title: `Look at apprenticeships linked to ${name}`,
          why: 'An apprenticeship is a paid job with training, so you can earn while you learn. Entry requirements vary, so check each one.',
          links,
          tasks: [
            'Find one apprenticeship and write down its level and entry requirements.',
            'Note anything you don’t have yet. That’s a good question for an adviser.',
            noExperience ? 'Write down one thing you’re good at. It doesn’t have to come from a job.' : 'Write down one hands-on thing you’ve done that you could mention.'
          ]
        };
      }

      case 'placements':
        return {
          id, label: 'Find internships and placements',
          title: 'Look for an engineering placement or internship',
          why: profile === 'graduate'
            ? 'Some internships are open to recent graduates. Each one sets its own requirements.'
            : 'A placement gives you industry experience before you graduate. Check whether your course allows a placement year.',
          links: [
            Object.assign({ after: 'The search matches loosely, so look for “placement” or “intern” in each job title and read its requirements and closing date. ' + checkListing }, S.workHub(`${area.search.role} placement`)),
            Object.assign({ after: 'Published information about one employer’s internship. It doesn’t mean places are open now. ' + D.PROGRAMMES.internship.facts }, S.mdlzEarlyCareers, { label: D.PROGRAMMES.internship.title })
          ],
          tasks: [
            'Check whether your course has a placement year, and when it would be.',
            'Shortlist three placements and note their closing dates.',
            'Ask your university careers service to look over your CV.'
          ]
        };

      case 'qualifications':
        return {
          id, label: 'Understand qualifications and training',
          title: `Find out what ${name} usually needs`,
          why: 'Knowing the usual routes in helps you choose a realistic next step, whether that’s a course, an apprenticeship or a job.',
          links: [
            Object.assign({ after: 'Read “How to become” and “Entry requirements”. Note which route fits you now.' }, ncs[0]),
            Object.assign({ after: 'Search for engineering or manufacturing courses near you.' }, S.ncsCourses)
          ],
          tasks: [
            'Write down the routes listed under “How to become”.',
            'Circle the one that fits your situation best right now.',
            adviserTask
          ]
        };

      case 'experience': {
        const links = [Object.assign({
          after: (a.age === 'yes' ? '' : 'Only for students aged 14–19. ') + 'Ask whether your school or college is registered with Futures For All. ' + D.PROGRAMMES.rwex.facts + ' We haven’t checked this year’s dates.'
        }, S.mdlzRwex, { label: D.PROGRAMMES.rwex.title })];
        links.push(Object.assign({ after: 'Read “Day-to-day tasks” to see what the job involves.' }, ncs[0]));
        return {
          id, label: 'Get introductory work experience',
          title: 'Get a taste of food manufacturing',
          why: 'You’re at school or college, so short work experience is a low-pressure way to try it out.',
          links,
          tasks: [
            'Ask your careers lead whether your school or college is registered with Futures For All.',
            'Set a reminder for February, when the RWEX page says applications open.',
            'Write one question you’d like to ask someone who works in ' + name + '.'
          ]
        };
      }

      default: // explore
        return {
          id, label: 'Explore careers further',
          title: `Get to know ${name}`,
          why: profile === 'unsure' || a.goal === 'unsure'
            ? 'No pressure: read what the job really involves before you decide anything.'
            : 'You want to know what the work is really like before you choose a route.',
          links: [
            Object.assign({ after: 'Read “Day-to-day tasks” and “What it takes”. Note one thing that surprised you.' }, ncs[0]),
            Object.assign({ after: 'Open Engineering to see how one food manufacturer describes the work.' }, S.mdlzCareerAreas)
          ],
          tasks: [
            'Read one career profile. It takes a few minutes.',
            'Write down one thing you’d enjoy and one thing you’re unsure about.',
            'Compare it with another career above. Tap “Make this my top pick” to switch.'
          ]
        };
    }
  }

  function recommend(answers) {
    const a = Object.assign({ interests: [], stage: null, age: null, experience: null, goal: null }, answers);
    const reasons = [];

    const profile = determineProfile(a, reasons);
    const careers = scoreCareers(a, profile, reasons);
    const actions = chooseActions(a, profile, reasons);

    return {
      profile,
      profileLabel: PROFILES[profile],
      primaryCareer: careers[0],
      altCareers: careers.slice(1, 3),
      actions,
      // Build the next move for the user's chosen career (defaults to the top match).
      nextMove: (careerId, actionId) => {
        const career = careers.find(c => c.area.id === careerId) || careers[0];
        const id = [actions.primary, ...actions.alternatives].includes(actionId) ? actionId : actions.primary;
        return { career, action: buildAction(id, a, profile, career.area), recommended: id === actions.primary };
      },
      reasons
    };
  }

  const API = { recommend, determineProfile, goalsFor, buildAction, PROFILES, ACTION_ORDER };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.FutureBiteRules = API;
})(typeof window !== 'undefined' ? window : globalThis);
