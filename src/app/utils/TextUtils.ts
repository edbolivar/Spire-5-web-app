const basicStyle = {
  fontWeight: 'normal',
  fontSize: 60,
  fontFamily: 'Booster Next FY Regular',
  fill: '#ffffff',
  align: 'center',
  // stroke: "#FFFFFF",
  // strokeThickness: 6
};


export function getStyleBody(
  size: number,
  color: number,
  weight: string = 'normal',
  alignment: string = 'center') {
  return {
    ...basicStyle,
    fontSize: size,
    fontWeight: weight,
    align: alignment,
    fill: '#' + ('000000' + ((color >>> 0) & 0xffffff).toString(16)).substr(-6)
  };
}

export default {
  getStyleBody
};
