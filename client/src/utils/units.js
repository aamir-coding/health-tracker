export const convertWeight = (kg, units) =>
  units === 'imperial' ? +(kg * 2.20462).toFixed(1) : kg

export const convertWeightToMetric = (val, units) =>
  units === 'imperial' ? +(val / 2.20462).toFixed(1) : val

export const convertWater = (ml, units) =>
  units === 'imperial' ? +(ml * 0.033814).toFixed(1) : ml

export const convertWaterToMetric = (val, units) =>
  units === 'imperial' ? Math.round(val / 0.033814) : val

export const convertHeight = (cm, units) => {
  if (units !== 'imperial') return `${cm} cm`
  const totalIn = cm / 2.54
  return `${Math.floor(totalIn / 12)}'${Math.round(totalIn % 12)}"`
}

export const heightParts = (cm) => {
  const totalIn = cm / 2.54
  return { feet: Math.floor(totalIn / 12), inches: Math.round(totalIn % 12) }
}

export const convertHeightToMetric = (feet, inches) =>
  Math.round((Number(feet) * 12 + Number(inches)) * 2.54 * 10) / 10

export const weightUnit = (units) => units === 'imperial' ? 'lbs' : 'kg'
export const waterUnit = (units) => units === 'imperial' ? 'fl oz' : 'ml'