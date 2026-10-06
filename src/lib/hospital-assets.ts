// Include the hospital artwork in Vite's asset graph so every deployment has
// content-hashed URLs. Missing files now fail the build instead of a game visit.
import hospitalMap from '../../public/hospital-preview/hospital-map.png';
import avatars from '../../public/hospital-preview/avatars.png';
import consultant from '../../public/hospital-preview/consultant.png';
export const hospitalAssets = {map: hospitalMap, avatars, consultant};
