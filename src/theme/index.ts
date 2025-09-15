import { colors } from './colors';

// Constantes de couleurs principales pour l'application
export const PRIMARY = colors.primary[500];        // #780000 - Rouge foncé BraPrime
export const SECONDARY = colors.secondary[500];    // #003049 - Bleu marine
export const ACCENT = colors.accent[500];          // #fdf0d5 - Beige
export const SUCCESS = colors.success[500];        // #669bbc - Bleu clair
export const WARNING = colors.warning[500];        // #780000 - Rouge foncé
export const ERROR = colors.error[500];            // #c1121f - Rouge moyen
export const INFO = colors.info[500];              // #003049 - Bleu marine

// Couleurs de fond
export const BACKGROUND_PRIMARY = colors.background.primary;    // #181A20
export const BACKGROUND_SECONDARY = colors.background.secondary; // #23262F
export const BACKGROUND_TERTIARY = colors.background.tertiary;  // #353945
export const BACKGROUND_CARD = colors.background.card;          // #2A2D3A

// Couleurs de texte
export const TEXT_PRIMARY = colors.text.primary;      // #FFFFFF
export const TEXT_SECONDARY = colors.text.secondary;  // #E5E7EB
export const TEXT_TERTIARY = colors.text.tertiary;    // #9CA3AF

// Couleurs d'action
export const ACTION_PRIMARY = colors.app.action.primary;    // #780000
export const ACTION_SECONDARY = colors.app.action.secondary; // #003049
export const ACTION_SUCCESS = colors.app.action.success;     // #669bbc
export const ACTION_DANGER = colors.app.action.danger;       // #c1121f

// Couleurs de statut
export const STATUS_PENDING = colors.app.pending;    // #780000
export const STATUS_ACTIVE = colors.app.active;      // #669bbc
export const STATUS_COMPLETED = colors.app.completed; // #003049
export const STATUS_CANCELLED = colors.app.cancelled; // #c1121f

// Couleurs de badge
export const BADGE_PRIMARY = colors.app.badge.primary;    // #780000
export const BADGE_SECONDARY = colors.app.badge.secondary; // #003049
export const BADGE_SUCCESS = colors.app.badge.success;     // #669bbc
export const BADGE_WARNING = colors.app.badge.warning;     // #c1121f
export const BADGE_INFO = colors.app.badge.info;           // #fdf0d5

// Export de toutes les couleurs et modules existants
export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';

// Thème complet
export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
}; 