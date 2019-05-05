export interface AnimationDefinition {
  id: string;
  image: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  scale: number;
  autoPlay: boolean;
}

type AnimationDefinitionMap = {
  [id: string]: AnimationDefinition;
};

export const AnimationDefinitions: AnimationDefinitionMap = {
  menu_character_dudejump: {
    id: 'menu_character_dudejump',
    image: 'assets/animations/menu/menu_character_dudejump.png',
    frameWidth: 170,
    frameHeight: 170,
    frames: 46,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_character_girlflip: {
    id: 'menu_character_girlflip',
    image: 'assets/animations/menu/menu_character_girlflip.png',
    frameWidth: 170,
    frameHeight: 170,
    frames: 57,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_character_headspin: {
    id: 'menu_character_headspin',
    image: 'assets/animations/menu/menu_character_headspin.png',
    frameWidth: 170,
    frameHeight: 170,
    frames: 118,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_element_bike: {
    id: 'menu_element_bike',
    image: 'assets/animations/menu/menu_element_bike.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: 62,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_element_heart: {
    id: 'menu_element_heart',
    image: 'assets/animations/menu/menu_element_heart.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: 82,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_element_headphones: {
    id: 'menu_element_headphones',
    image: 'assets/animations/menu/menu_element_headphones.png',
    frameWidth: 128,
    frameHeight: 128,
    frames: 95,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_metaballs_dudejump_1: {
    id: 'menu_metaballs_dudejump_1',
    image: 'assets/animations/menu/menu_metaballs_dudejump_1.png',
    frameWidth: 50,
    frameHeight: 87,
    frames: 27,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  menu_metaballs_dudejump_2: {
    id: 'menu_metaballs_dudejump_2',
    image: 'assets/animations/menu/menu_metaballs_dudejump_2.png',
    frameWidth: 50,
    frameHeight: 89,
    frames: 26,
    fps: 30,
    scale: 1,
    autoPlay: false
  },
  secondary_headphone: {
    id: 'secondary_headphone',
    image: 'assets/animations/brands/secondary_headphone.png',
    frameWidth: 186,
    frameHeight: 268,
    frames: 72,
    fps: 15,
    scale: 2,
    autoPlay: true
  },
  secondary_skateboard: {
    id: 'secondary_skateboard',
    image: 'assets/animations/brands/secondary_skateboard.png',
    frameWidth: 210,
    frameHeight: 210,
    frames: 73,
    fps: 15,
    scale: 1.67,
    autoPlay: true
  },
  secondary_sweet: {
    id: 'secondary_sweet',
    image: 'assets/animations/brands/secondary_sweet.png',
    frameWidth: 192,
    frameHeight: 167,
    frames: 73,
    fps: 15,
    scale: 2,
    autoPlay: true
  }
};
