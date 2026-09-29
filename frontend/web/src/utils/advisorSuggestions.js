/**
 * Context-aware follow-up question suggestions for student career exploration.
 * Generates relevant, clickable suggestions based on topic, query, and career category.
 */

export function getSuggestedFollowUps(topic = '', question = '') {
  const qLower = (question || '').toLowerCase();
  const tLower = (topic || '').toLowerCase();

  // 1. Software Development / Coding / IT
  if (tLower.includes('software') || qLower.includes('software developer') || qLower.includes('coder') || qLower.includes('programmer')) {
    return [
      'What skills do I need to become a software developer?',
      'How can I become a software developer after Class 10?',
      'What programming languages should I learn first?',
      'What is a typical work day like for a software developer?'
    ];
  }

  // 2. Electrician / Electrical Engineering / Vocational
  if (tLower.includes('electrician') || qLower.includes('electrician')) {
    return [
      'What skills does an electrician need?',
      'How do I become an electrician after Class 10 or ITI?',
      'What tools and safety equipment do electricians use?',
      'What career growth opportunities exist for electricians?'
    ];
  }

  // 3. Graphic Design / Creative / UI/UX
  if (tLower.includes('graphic design') || qLower.includes('graphic designer') || qLower.includes('designer')) {
    return [
      'What software and tools do graphic designers use?',
      'How do I build a design portfolio as a beginner?',
      'Can I pursue graphic design after Class 10 or PUC Arts?',
      'What are freelance vs full-time career options?'
    ];
  }

  // 4. Data Analytics / Data Science / Math
  if (tLower.includes('data analyst') || qLower.includes('data analyst') || qLower.includes('data science')) {
    return [
      'What math and coding skills does a data analyst need?',
      'Which degree is best for a data analyst career?',
      'How does a data analyst differ from a data scientist?',
      'What beginner projects can I build to learn data analysis?'
    ];
  }

  // 5. Post-Class 10 pathways & Computer interests
  if (tLower.includes('class 10') || qLower.includes('class 10') || qLower.includes('after 10th') || qLower.includes('computers')) {
    return [
      'What is the difference between Polytechnic Diploma and PUC?',
      'Which stream is best if I want to do engineering?',
      'What are the top ITI skill trades after Class 10?',
      'Can I join an engineering degree directly after a Diploma?'
    ];
  }

  // 6. Post-PUC Science / Technology entrance
  if (tLower.includes('puc') || qLower.includes('puc science') || qLower.includes('after 12th') || qLower.includes('puc')) {
    return [
      'What entrance exams (KCET / JEE) do I need to prepare for?',
      'Can I pursue BCA or B.Sc instead of B.Tech?',
      'Which engineering branches have high future demand?',
      'What skills should I learn during graduation?'
    ];
  }

  // 7. Karnataka Polytechnic / Diploma Eligibility
  if (tLower.includes('diploma') || qLower.includes('diploma') || qLower.includes('eligibility')) {
    return [
      'What documents are required for polytechnic admission?',
      'What is the fee structure for government polytechnic colleges in Karnataka?',
      'How does lateral entry to B.E. second year work?',
      'What are the top polytechnic branches in Karnataka?'
    ];
  }

  // 8. Cybersecurity / Specialized IT in Karnataka
  if (tLower.includes('cybersecurity') || qLower.includes('cybersecurity')) {
    return [
      'Which colleges in Karnataka offer cybersecurity specializations?',
      'What certifications (like CompTIA Security+) help beginners?',
      'Can I study cybersecurity through Diploma or BCA?',
      'What does a cybersecurity analyst do day-to-day?'
    ];
  }

  // 9. Topic-specific fallback if topic is known
  if (topic && topic !== 'Career Exploration' && topic !== 'Out of Scope' && topic !== 'Course Inquiry') {
    return [
      `What skills do I need to succeed in ${topic}?`,
      `How can I start preparing for ${topic} after Class 10?`,
      `What education path is required for ${topic}?`,
      `What is the day-to-day work environment like?`
    ];
  }

  // 10. General discovery starter suggestions
  return [
    'What does a software developer do?',
    'What does an electrician do?',
    'What can I do after Class 10 if I like computers?',
    'How do I choose between Science, Commerce, and Arts?'
  ];
}
