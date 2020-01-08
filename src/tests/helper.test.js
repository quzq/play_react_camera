

import * as helper from '../helper/helper'



describe(`helper`, () => {
  describe(`stretchSize`, ()=>{
    it(`(16,8),(4,4) => (8,8)`, ()=>{
      const {width, height} = helper.stretchSize(16,8,4,4)
      expect(width).toBe(8)
      expect(height).toBe(8)
    })
    it(`(16,8),(4,8) => (4,8)`, ()=>{
      const {width, height} = helper.stretchSize(16,8,4,8)
      expect(width).toBe(4)
      expect(height).toBe(8)
    })
    it(`(16,8),(16,4) => (16,4)`, ()=>{
      const {width, height} = helper.stretchSize(16,8,16,4)
      expect(width).toBe(16)
      expect(height).toBe(4)
    })
    it(`(null,8),(16,4) => (0,0)`, ()=>{
      const {width, height} = helper.stretchSize(null,8,16,4)
      expect(width).toBe(0)
      expect(height).toBe(0)
    })
    it(`(16,null),(16,4) => (0,0)`, ()=>{
      const {width, height} = helper.stretchSize(16,null,16,4)
      expect(width).toBe(0)
      expect(height).toBe(0)
    })
    it(`(16,8),(null,4) => (0,0)`, ()=>{
      const {width, height} = helper.stretchSize(16,8,null,4)
      expect(width).toBe(0)
      expect(height).toBe(0)
    })
    it(`(16,8),(16,null) => (0,0)`, ()=>{
      const {width, height} = helper.stretchSize(16,8,16,null)
      expect(width).toBe(0)
      expect(height).toBe(0)
    })
  })
})
