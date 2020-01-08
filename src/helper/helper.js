export const stretchSize = (parentWidth, parentHeight, childWidth, childHeight) => {
  if (!parentWidth || !parentHeight || !childWidth || !childHeight) return { width: 0, height: 0 }

  // width基準にストレッチ
  const height = parseInt(parentWidth / childWidth * childHeight)
  if (parentHeight > height) return { width: parentWidth, height, base: 'width' }
  // height基準にストレッチ
  const width = parseInt(parentHeight / childHeight * childWidth)
  return { width, height: parentHeight, base: 'height' }
}