import tanzImg from '../../img/Tanz.jpeg';
import thanzzImg from '../../img/Thanzz.jpeg';
import priiiImg from '../../img/Priii.jpeg';
import ayyanImg from '../../img/Ayyan.jpeg';

/**
 * Verified Founder Information for Udaan AI.
 * Strict compliance:
 * - Only verified roles and images are mapped.
 * - No fictional biographies or unsupported achievements.
 * - Only verified social URLs are included; missing social profiles are null (no icon rendered).
 */
export const founders = [
  {
    id: 'tanjila',
    name: 'Tanjila B',
    role: 'Full Stack Developer',
    image: tanzImg,
    fallbackImage: '/img/Tanz.jpeg',
    alt: 'Tanjila B, Full Stack Developer at Udaan AI',
    description: 'Specializes in end-to-end service integration, API connectivity, and core educational data flow.',
    socials: {
      github: 'https://github.com/Tanjila-01',
      linkedin: null,
    },
  },
  {
    id: 'thanusha',
    name: 'Thanusha M H',
    role: 'Web Developer',
    image: thanzzImg,
    fallbackImage: '/img/Thanzz.jpeg',
    alt: 'Thanusha M H, Web Developer at Udaan AI',
    description: 'Focuses on intuitive student-facing interfaces, responsive layouts, and accessible career exploration experiences.',
    socials: {
      github: null,
      linkedin: null,
    },
  },
  {
    id: 'priyanka',
    name: 'Priyanka M',
    role: 'Frontend Developer',
    image: priiiImg,
    fallbackImage: '/img/Priii.jpeg',
    alt: 'Priyanka M, Frontend Developer at Udaan AI',
    description: 'Works on responsive web development, component architecture, and structured educational pathways.',

    socials: {
      github: null,
      linkedin: null,
    },
  },
  {
    id: 'abbas',
    name: 'M A Abbas',
    role: 'UI/UX Designer',
    image: ayyanImg,
    fallbackImage: '/img/Ayyan.jpeg',
    alt: 'M A Abbas, UI/UX Designer at Udaan AI',
    description: 'Shapes visual interaction patterns, clarity in decision interfaces, and student navigation flows.',
    socials: {
      github: null,
      linkedin: null,
    },
  },
];
