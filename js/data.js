/*
 * fieldwork content data. Employer-neutral: careers are described in general
 * terms, and opportunities come from verified public sources.
 *
 * Verified 2026-10-22:
 *  - GOV.UK Work Hub job search (?keywords=) and Find an apprenticeship (?searchTerm=)
 *    both return live listings for every search term used below.
 *  - Every National Careers Service profile slug below loads a real profile (not a 404 page).
 *  - Mondelēz International programme facts come from its official UK early-careers pages.
 * No vacancy is ever shown as open: fieldwork links to searches, not to adverts.
 */
(function (root) {
  'use strict';

  const enc = encodeURIComponent;

  // How each kind of link is labelled. 'vacancy' exists so the UI can explain
  // that confirmed live vacancies are never shown; no data uses it.
  const LINK_TYPES = {
    search: 'Job search · live listings on another site',
    info: 'Careers information',
    employer: 'Employer careers page',
    programme: 'Published programme info · not a vacancy',
    vacancy: 'Confirmed live vacancy'
  };

  const SOURCES = {
    workHub: q => ({
      type: 'search',
      label: `Search “${q}” on GOV.UK Work Hub`,
      url: `https://www.jobs.service.gov.uk/jobs/search?keywords=${enc(q)}`
    }),
    apprenticeships: q => ({
      type: 'search',
      label: `Search “${q}” on GOV.UK Find an apprenticeship`,
      url: `https://www.findapprenticeship.service.gov.uk/apprenticeships?searchTerm=${enc(q)}`
    }),
    ncsProfile: (slug, name) => ({
      type: 'info',
      label: `National Careers Service: ${name} profile`,
      url: `https://nationalcareers.service.gov.uk/job-profiles/${slug}`
    }),
    ncsCourses: {
      type: 'info',
      label: 'National Careers Service: Find a course',
      url: 'https://nationalcareers.service.gov.uk/find-a-course'
    },
    ncsSkills: {
      type: 'info',
      label: 'National Careers Service: Discover your skills and careers',
      url: 'https://nationalcareers.service.gov.uk/skills-assessment'
    },
    becomeApprentice: {
      type: 'info',
      label: 'GOV.UK: Become an apprentice',
      url: 'https://www.gov.uk/become-apprentice'
    },
    mdlzCareerAreas: {
      type: 'employer',
      label: 'Mondelēz International: career areas',
      url: 'https://www.mondelezinternational.com/careers/career-areas/'
    },
    mdlzEarlyCareers: {
      type: 'programme',
      label: 'Mondelēz International: UK early careers',
      url: 'https://www.mondelezinternational.com/careers/early-careers/united-kingdom/'
    },
    mdlzRwex: {
      type: 'programme',
      label: 'Mondelēz International: Remote Work Experience (RWEX)',
      url: 'https://www.mondelezinternational.com/careers/early-careers/united-kingdom/remote-work-experience-rwex/'
    }
  };

  const INTERESTS = [
    { id: 'machines', label: 'Fixing things and keeping machines running', icon: 'gear',
      link: 'Like working out why a wrapping machine keeps jamming, and getting it going again.' },
    { id: 'tech', label: 'Tech, robots and automation', icon: 'chip',
      link: 'Like programming a robot arm or a sensor that checks every product on the line.' },
    { id: 'process', label: 'Making things work better and faster', icon: 'flow',
      link: 'Like finding out why one batch came out different and making sure it doesn’t happen again.' },
    { id: 'sustainability', label: 'Cutting waste and saving energy', icon: 'leaf',
      link: 'Like reducing packaging or the energy an oven uses.' },
    { id: 'unsure', label: 'Not sure yet', icon: 'spark',
      link: 'That’s fine. We’ll show you a mix to explore.' }
  ];

  // Stage says where someone is now. It never implies work experience:
  // experience is asked separately and only counts when the user says yes.
  const STAGES = [
    { id: 'exploring', label: 'Not studying right now and looking for a way in' },
    { id: 'school', label: 'At school or college' },
    { id: 'university', label: 'At university' },
    { id: 'graduate', label: 'I’ve finished a degree' },
    { id: 'unsure', label: 'Not sure' }
  ];

  // Optional, only for school/college. Used for one programme's age range; never stored.
  const AGE_OPTIONS = [
    { id: 'yes', label: 'Yes, I’m 14–19' },
    { id: 'no', label: 'No' },
    { id: 'skip', label: 'Prefer not to say' }
  ];

  const EXPERIENCE_OPTIONS = [
    { id: 'yes', label: 'Yes, I’ve done some hands-on or technical work' },
    { id: 'no', label: 'Not yet' }
  ];

  // Goals shown depend on stage, so every option on screen is relevant.
  const GOALS = [
    { id: 'unsure', label: 'Not sure. Show me where to start', stages: ['exploring', 'school', 'university', 'graduate', 'unsure'] },
    { id: 'discover', label: 'Find out what the work is actually like', stages: ['exploring', 'school', 'university', 'graduate', 'unsure'] },
    { id: 'jobs', label: 'Find a job', stages: ['exploring', 'unsure'] },
    { id: 'earn', label: 'Earn while I learn', stages: ['exploring', 'school', 'unsure'] },
    { id: 'training', label: 'Find out what qualifications or training I need', stages: ['exploring', 'school', 'unsure'] },
    { id: 'experience', label: 'Get a taste with work experience', stages: ['school'] },
    { id: 'internship', label: 'Find a placement year or internship', stages: ['university', 'graduate'] },
    { id: 'graduate', label: 'Find a graduate role', stages: ['university', 'graduate'] }
  ];

  // Career areas found across food manufacturing. Example tasks are general and
  // labelled illustrative in the UI. `search` terms each return live listings.
  const CAREER_AREAS = [
    {
      id: 'plant',
      title: 'Maintenance engineering',
      icon: 'gear',
      everyday: 'You keep the factory’s machines safe and running, and you’re the one people call when something stops.',
      problems: [
        'A wrapping machine keeps jamming. Find out why and fix it.',
        'Plan maintenance so machines don’t break down mid-shift.',
        'Make sure equipment is safe to work around.'
      ],
      matters: 'When one machine stops, a whole line can stop. Reliable machines mean less waste and fewer delays.',
      weights: { machines: 3, process: 1, sustainability: 1 },
      because: {
        machines: 'you like fixing things, and that’s the heart of this job',
        process: 'reliable machines make the whole process run better',
        sustainability: 'well-looked-after machines waste less energy and product'
      },
      search: { entry: 'trainee maintenance engineer', role: 'maintenance engineer', apprenticeship: 'maintenance' },
      ncs: [['engineering-maintenance-technician', 'Engineering maintenance technician'], ['maintenance-fitter', 'Maintenance fitter']]
    },
    {
      id: 'automation',
      title: 'Automation & robotics',
      icon: 'chip',
      everyday: 'You set up and improve the robots, sensors and control systems that run production lines.',
      problems: [
        'Program a robot to pick up and place products.',
        'Find out why a sensor keeps stopping the line.',
        'Use data from the line to spot problems early.'
      ],
      matters: 'Automation can take on repetitive or heavy tasks and help keep products consistent.',
      weights: { tech: 3, machines: 2, process: 1 },
      because: {
        tech: 'you’re into tech, robots and automation',
        machines: 'robots are machines with smart controls',
        process: 'automation is one way to make production work better'
      },
      search: { entry: 'automation technician', role: 'automation engineer', apprenticeship: 'engineering technician' },
      ncs: [['robotics-engineer', 'Robotics engineer'], ['electrical-engineering-technician', 'Electrical engineering technician']]
    },
    {
      id: 'process',
      title: 'Process engineering',
      icon: 'flow',
      everyday: 'You work out the best way to turn ingredients into finished products, the same way every time.',
      problems: [
        'Find out why one batch came out different from the rest.',
        'Speed up a line without hurting quality.',
        'Cut the energy an oven uses.'
      ],
      matters: 'A good process means consistent products, less waste and less energy used.',
      weights: { process: 3, sustainability: 2, tech: 1 },
      because: {
        process: 'you like making things work better',
        sustainability: 'better processes use less energy and create less waste',
        tech: 'process data and controls drive improvements'
      },
      search: { entry: 'process operator', role: 'process engineer', apprenticeship: 'manufacturing' },
      ncs: [['manufacturing-systems-engineer', 'Manufacturing systems engineer'], ['chemical-engineer', 'Chemical engineer']]
    },
    {
      id: 'project',
      title: 'Project engineering',
      icon: 'blueprint',
      everyday: 'You plan and deliver new production lines and equipment, from the first idea to switching them on.',
      problems: [
        'Help plan where a new production line will go.',
        'Keep an installation on time and on budget.',
        'Test new equipment before it starts making products.'
      ],
      matters: 'New lines and equipment shape how a site runs for years.',
      weights: { process: 2, machines: 1, tech: 1, sustainability: 1 },
      because: {
        process: 'new projects are how production gets redesigned',
        machines: 'projects install and test new machinery',
        tech: 'new lines bring in new technology',
        sustainability: 'new equipment decides how efficient a site will be'
      },
      search: { entry: 'trainee project engineer', role: 'project engineer', apprenticeship: 'engineering' },
      ncs: [['mechanical-engineer', 'Mechanical engineer']]
    },
    {
      id: 'packaging',
      title: 'Packaging engineering',
      icon: 'box',
      everyday: 'You work on the machines and materials that wrap and protect products, including greener packaging.',
      problems: [
        'Reduce how much material a wrapper uses.',
        'Fix a machine that isn’t sealing packs properly.',
        'Test whether a recyclable material runs well on the machines.'
      ],
      matters: 'Packaging keeps food safe, and it’s also where a lot of waste can be cut.',
      weights: { sustainability: 3, machines: 1, tech: 1 },
      because: {
        sustainability: 'you want to cut waste, and packaging is a big part of that',
        machines: 'packing lines are some of the fastest machines in a factory',
        tech: 'modern packing lines are highly automated'
      },
      search: { entry: 'packaging operative', role: 'packaging engineer', apprenticeship: 'manufacturing' },
      ncs: [['packaging-technologist', 'Packaging technologist']]
    },
    {
      id: 'operations',
      title: 'Manufacturing operations',
      icon: 'factory',
      everyday: 'You help run production day to day, working with the team and engineers to make products safely and to standard. This is an operations role, not an engineering one.',
      problems: [
        'Run part of a production line and keep it on plan.',
        'Spot a quality problem early and flag it.',
        'Work with engineers when something goes wrong.'
      ],
      matters: 'Operations teams keep products coming off the line safely and to standard.',
      weights: { process: 2, machines: 1 },
      because: {
        process: 'operations teams see production problems first and help solve them',
        machines: 'you’d work hands-on with production equipment'
      },
      search: { entry: 'food production operative', role: 'production supervisor', apprenticeship: 'manufacturing' },
      ncs: [['food-factory-worker', 'Food factory worker'], ['engineering-operative', 'Engineering operative']]
    }
  ];

  const STARTER_AREAS = ['plant', 'process', 'automation'];
  const HANDS_ON_STARTER_AREAS = ['plant', 'operations', 'process'];

  // Things people do outside paid work, and the skills they can point to.
  const SKILL_SPOTTER = [
    { id: 'study', label: 'School or college work, even if I didn’t finish', skill: 'Learning new things and getting work done to a deadline' },
    { id: 'fixing', label: 'Fixing or building things: bikes, PCs, DIY, games setups', skill: 'Working out what’s wrong and fixing it' },
    { id: 'team', label: 'Sport, a club or a team activity', skill: 'Teamwork and turning up when people are counting on you' },
    { id: 'volunteer', label: 'Volunteering or helping out locally', skill: 'Reliability and working with different people' },
    { id: 'caring', label: 'Caring for family or friends', skill: 'Responsibility, organisation and staying calm under pressure' },
    { id: 'project', label: 'A project I planned and finished', skill: 'Planning a task and seeing it through' }
  ];

  // Published programme information from one verified employer (Mondelēz International).
  // Shown as programme info only, never as an open vacancy.
  const PROGRAMMES = {
    rwex: {
      title: 'Remote Work Experience (RWEX), Mondelēz International',
      facts: 'Five days online for students aged 14–19. Your school or college must be registered with Futures For All. The official page says applications open every February.'
    },
    apprenticeship: {
      title: 'Manufacturing apprenticeships, Mondelēz International',
      facts: 'Its UK page lists apprenticeships in Operations (Manufacturing), not engineering, from Level 3 operator roles up to Level 6 degree apprenticeships.'
    },
    internship: {
      title: 'Engineering (Manufacturing) internship, Mondelēz International',
      facts: 'A 12-month placement for industrial placement students or recent graduates.'
    },
    graduate: {
      title: 'Engineering & Operations graduate scheme, Mondelēz International',
      facts: 'Three 12-month placements in your home function, with a mentor and a buddy.'
    }
  };

  const DATA = {
    LINK_TYPES, SOURCES, INTERESTS, STAGES, AGE_OPTIONS, EXPERIENCE_OPTIONS, GOALS,
    CAREER_AREAS, STARTER_AREAS, HANDS_ON_STARTER_AREAS, SKILL_SPOTTER, PROGRAMMES,
    VERIFIED_ON: '2026-10-22'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  root.FutureBiteData = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
