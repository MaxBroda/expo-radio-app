export const dark = {
  bg: { base: '#0E0A14', studio: '#0A0710' },
  surface: {
    default: '#19131F',
    sunken: '#140E1A',
    raised: '#201828',
    disabled: '#1E1826',
  },
  line: { default: '#2E2538', strong: '#3A3246' },
  text: { default: '#F6F3F8', secondary: '#CFC6D6', muted: '#9C93A8', disabled: '#6E667C' },
  accent: {
    base: '#FF3D7F',
    ink: '#1A0610',
    surface: '#2A1020',
    border: '#6B2545',
    text: '#FFA8C6',
  },
  data: { base: '#9B7BFF', surface: '#1C1630', border: '#4A3A7A', text: '#C6B4FF' },
  critical: { base: '#FF9E8E', surface: '#2A1714', border: '#7A3A30', text: '#FFB5A6' },
  scale: { low: '#FF8172', mid: '#6E667C', high: '#9B7BFF' },
  ripple: { neutral: 'rgba(246, 243, 248, 0.14)', accent: 'rgba(255, 61, 127, 0.28)' },
  pressedOverlay: 'rgba(0, 0, 0, 0.2)',
};

export type Colors = typeof dark;

export const light: Colors = {
  bg: { base: '#F7F5F9', studio: '#EFEBF2' },
  surface: {
    default: '#FFFFFF',
    sunken: '#F1EDF5',
    raised: '#FCE7F0',
    disabled: '#F1EDF5',
  },
  line: { default: '#DED7E4', strong: '#C8BFD2' },
  text: { default: '#15101C', secondary: '#3E3648', muted: '#5E5569', disabled: '#8C8397' },
  accent: {
    base: '#C2185B',
    ink: '#FFFFFF',
    surface: '#FCE7F0',
    border: '#F0B9D2',
    text: '#8E1348',
  },
  data: { base: '#5B35C7', surface: '#EDE7FB', border: '#C4B2F2', text: '#3F1F9B' },
  critical: { base: '#B33B2A', surface: '#FBE8E4', border: '#E8B5AA', text: '#8E2A1C' },
  scale: { low: '#B33B2A', mid: '#6B6377', high: '#5B35C7' },
  ripple: { neutral: 'rgba(21, 16, 28, 0.1)', accent: 'rgba(194, 24, 91, 0.2)' },
  pressedOverlay: 'rgba(21, 16, 28, 0.06)',
};
