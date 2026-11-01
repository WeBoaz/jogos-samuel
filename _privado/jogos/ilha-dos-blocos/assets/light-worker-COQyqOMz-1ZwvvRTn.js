// src/index.ts
var _AABB = class {
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.minX = minX;
    this.minY = minY;
    this.minZ = minZ;
    this.maxX = maxX;
    this.maxY = maxY;
    this.maxZ = maxZ;
    this.getMin = (axis) => {
      if (axis === 0) {
        return this.minX;
      } else if (axis === 1) {
        return this.minY;
      } else if (axis === 2) {
        return this.minZ;
      } else {
        throw new Error("GetMinError: Unknown axis.");
      }
    };
    this.setMin = (axis, value) => {
      if (axis === 0) {
        this.minX = value;
      } else if (axis === 1) {
        this.minY = value;
      } else if (axis === 2) {
        this.minZ = value;
      } else {
        throw new Error("SetMinError: Unknown axis.");
      }
    };
    this.getMax = (axis) => {
      if (axis === 0) {
        return this.maxX;
      } else if (axis === 1) {
        return this.maxY;
      } else if (axis === 2) {
        return this.maxZ;
      } else {
        throw new Error("GetMaxError: Unknown axis.");
      }
    };
    this.setMax = (axis, value) => {
      if (axis === 0) {
        this.maxX = value;
      } else if (axis === 1) {
        this.maxY = value;
      } else if (axis === 2) {
        this.maxZ = value;
      } else {
        throw new Error("SetMaxError: Unknown axis.");
      }
    };
    this.translate = ([dx, dy, dz]) => {
      this.minX += dx;
      this.minY += dy;
      this.minZ += dz;
      this.maxX += dx;
      this.maxY += dy;
      this.maxZ += dz;
      return this;
    };
    this.translateAxis = (axis, delta) => {
      if (axis === 0) {
        this.minX += delta;
        this.maxX += delta;
      } else if (axis === 1) {
        this.minY += delta;
        this.maxY += delta;
      } else if (axis === 2) {
        this.minZ += delta;
        this.maxZ += delta;
      } else {
        throw new Error("TranslateAxisError: Unknown axis.");
      }
      return this;
    };
    this.setPosition = ([px, py, pz]) => {
      this.maxX = px + this.width;
      this.maxY = py + this.height;
      this.maxZ = pz + this.depth;
      this.minX = px;
      this.minY = py;
      this.minZ = pz;
      return this;
    };
    this.intersects = (aabb) => {
      if (aabb.minX >= this.maxX)
        return false;
      if (aabb.minY >= this.maxY)
        return false;
      if (aabb.minZ >= this.maxZ)
        return false;
      if (aabb.maxX <= this.minX)
        return false;
      if (aabb.maxY <= this.minY)
        return false;
      if (aabb.maxZ <= this.minZ)
        return false;
      return true;
    };
    this.touches = (aabb) => {
      const intersection = this.intersection(aabb);
      return intersection !== null && (intersection.width === 0 || intersection.height === 0 || intersection.depth === 0);
    };
    this.union = (aabb) => {
      return new _AABB(
        Math.min(this.minX, aabb.minX),
        Math.min(this.minY, aabb.minY),
        Math.min(this.minZ, aabb.minZ),
        Math.max(this.maxX, aabb.maxX),
        Math.max(this.maxY, aabb.maxY),
        Math.max(this.maxZ, aabb.maxZ)
      );
    };
    this.intersection = (aabb) => {
      return new _AABB(
        Math.max(this.minX, aabb.minX),
        Math.max(this.minY, aabb.minY),
        Math.max(this.minZ, aabb.minZ),
        Math.min(this.maxX, aabb.maxX),
        Math.min(this.maxY, aabb.maxY),
        Math.min(this.maxZ, aabb.maxZ)
      );
    };
    this.clone = () => {
      return new _AABB(
        this.minX,
        this.minY,
        this.minZ,
        this.maxX,
        this.maxY,
        this.maxZ
      );
    };
  }
  get width() {
    return this.maxX - this.minX;
  }
  get height() {
    return this.maxY - this.minY;
  }
  get depth() {
    return this.maxZ - this.minZ;
  }
  get mag() {
    return Math.sqrt(
      (this.maxX - this.minX) ** 2 + (this.maxY - this.minY) ** 2 + (this.maxZ - this.minZ) ** 2
    );
  }
  computeOffsetX(aabb, deltaX) {
    const intersection = this.intersection(aabb);
    if (intersection.height <= 0 || intersection.depth <= 0) {
      return deltaX;
    }
    if (intersection.width >= 0) {
      return 0;
    }
    if (deltaX > 0 && aabb.minX >= this.maxX) {
      return Math.min(aabb.minX - this.maxX, deltaX);
    }
    if (deltaX < 0 && aabb.maxX <= this.minX) {
      return Math.max(aabb.maxX - this.minX, deltaX);
    }
    return deltaX;
  }
  computeOffsetY(aabb, deltaY) {
    const intersection = this.intersection(aabb);
    if (intersection.width <= 0 || intersection.depth <= 0) {
      return deltaY;
    }
    if (intersection.height >= 0) {
      return 0;
    }
    if (deltaY > 0 && aabb.minY >= this.maxY) {
      return Math.min(aabb.minY - this.maxY, deltaY);
    }
    if (deltaY < 0 && aabb.maxY <= this.minY) {
      return Math.max(aabb.maxY - this.minY, deltaY);
    }
    return deltaY;
  }
  computeOffsetZ(aabb, deltaZ) {
    const intersection = this.intersection(aabb);
    if (intersection.width <= 0 || intersection.height <= 0) {
      return deltaZ;
    }
    if (intersection.depth >= 0) {
      return 0;
    }
    if (deltaZ > 0 && aabb.minZ >= this.maxZ) {
      return Math.min(aabb.minZ - this.maxZ, deltaZ);
    }
    if (deltaZ < 0 && aabb.maxZ <= this.minZ) {
      return Math.max(aabb.maxZ - this.minZ, deltaZ);
    }
    return deltaZ;
  }
};
var AABB = _AABB;
AABB.union = (all) => {
  let minX = all[0].minX;
  let minY = all[0].minY;
  let minZ = all[0].minZ;
  let maxX = all[0].maxX;
  let maxY = all[0].maxY;
  let maxZ = all[0].maxZ;
  for (const aabb of all) {
    minX = Math.min(minX, aabb.minX);
    minY = Math.min(minY, aabb.minY);
    minZ = Math.min(minZ, aabb.minZ);
    maxX = Math.max(maxX, aabb.maxX);
    maxY = Math.max(maxY, aabb.maxY);
    maxZ = Math.max(maxZ, aabb.maxZ);
  }
  return new _AABB(minX, minY, minZ, maxX, maxY, maxZ);
};

var BlockRuleLogic = /* @__PURE__ */ ((BlockRuleLogic2) => {
  BlockRuleLogic2["And"] = "and";
  BlockRuleLogic2["Or"] = "or";
  BlockRuleLogic2["Not"] = "not";
  return BlockRuleLogic2;
})(BlockRuleLogic || {});
const PY_ROTATION = 0;
const NY_ROTATION = 1;
const PX_ROTATION = 2;
const NX_ROTATION = 3;
const PZ_ROTATION = 4;
const NZ_ROTATION = 5;
const Y_ROT_SEGMENTS = 16;
const PI = Math.PI;
const PI_2 = Math.PI / 2;
class BlockRotation {
  /**
   * Create a new block rotation.
   *
   * @param value The axis this block is pointing towards.
   * @param yRotation The rotation around the axis this block is pointing towards, rounded to the nearest (360 / 16) degrees.
   */
  constructor(value = PY_ROTATION, yRotation = 0) {
    /**
     * Rotate a 3D coordinate by this block rotation.
     *
     * @param node A 3D coordinate in the form of [x, y, z] to be rotated by this block rotation.
     * @param yRotate Whether or not should the y-rotation be applied.
     * @param translate Whether or not should the translation be applied.
     */
    this.rotateNode = (node, yRotate = true, translate = true) => {
      if (yRotate && this.yRotation !== 0) {
        node[0] -= 0.5;
        node[2] -= 0.5;
        BlockRotation.rotateY(node, this.yRotation);
        node[0] += 0.5;
        node[2] += 0.5;
      }
      switch (this.value) {
        case PX_ROTATION: {
          BlockRotation.rotateZ(node, -PI_2);
          if (translate) node[1] += 1;
          break;
        }
        case NX_ROTATION: {
          BlockRotation.rotateZ(node, PI_2);
          if (translate) node[0] += 1;
          break;
        }
        case PY_ROTATION: {
          break;
        }
        case NY_ROTATION: {
          BlockRotation.rotateX(node, PI);
          if (translate) {
            node[1] += 1;
            node[2] += 1;
          }
          break;
        }
        case PZ_ROTATION: {
          BlockRotation.rotateX(node, PI_2);
          if (translate) node[1] += 1;
          break;
        }
        case NZ_ROTATION: {
          BlockRotation.rotateX(node, -PI_2);
          if (translate) node[2] += 1;
          break;
        }
      }
    };
    /**
     * Rotate an axis aligned bounding box by this block rotation, recalculating the new
     * maximum and minimum coordinates to this AABB.
     *
     * @param aabb The axis aligned bounding box to be rotated.
     * @param yRotate Whether or not should the y-rotation be applied.
     * @param translate Whether or not should the translation be applied.
     * @returns A new axis aligned bounding box.
     */
    this.rotateAABB = (aabb, yRotate = true, translate = true) => {
      if (this.value === PY_ROTATION && (this.yRotation === 0 || !yRotate)) {
        return aabb.clone();
      }
      const min = [aabb.minX, aabb.minY, aabb.minZ];
      const max = [aabb.maxX, aabb.maxY, aabb.maxZ];
      let minX = null;
      let minZ = null;
      let maxX = null;
      let maxZ = null;
      if (yRotate && this.yRotation !== 0) {
        const min1 = [aabb.minX, aabb.minY, aabb.minZ];
        const min2 = [aabb.minX, aabb.minY, aabb.maxZ];
        const min3 = [aabb.maxX, aabb.minY, aabb.minZ];
        const min4 = [aabb.maxX, aabb.minY, aabb.maxZ];
        [min1, min2, min3, min4].forEach((min5) => {
          this.rotateNode(min5, true, true);
          minX = minX === null ? min5[0] : Math.min(minX, min5[0]);
          minZ = minZ === null ? min5[2] : Math.min(minZ, min5[2]);
        });
        const max1 = [aabb.minX, aabb.maxY, aabb.minZ];
        const max2 = [aabb.minX, aabb.maxY, aabb.maxZ];
        const max3 = [aabb.maxX, aabb.maxY, aabb.minZ];
        const max4 = [aabb.maxX, aabb.maxY, aabb.maxZ];
        [max1, max2, max3, max4].forEach((max5) => {
          this.rotateNode(max5, true, true);
          maxX = maxX === null ? max5[0] : Math.max(maxX, max5[0]);
          maxZ = maxZ === null ? max5[2] : Math.max(maxZ, max5[2]);
        });
      }
      this.rotateNode(min, yRotate, translate);
      this.rotateNode(max, yRotate, translate);
      const EPSILON = 1e-4;
      const justify = (num) => num < EPSILON ? 0 : num;
      min[0] = justify(min[0]);
      min[1] = justify(min[1]);
      min[2] = justify(min[2]);
      max[0] = justify(max[0]);
      max[1] = justify(max[1]);
      max[2] = justify(max[2]);
      const realMin = [
        minX !== null ? justify(minX) : Math.min(min[0], max[0]),
        Math.min(min[1], max[1]),
        minZ !== null ? justify(minZ) : Math.min(min[2], max[2])
      ];
      const realMax = [
        maxX !== null ? justify(maxX) : Math.max(min[0], max[0]),
        Math.max(min[1], max[1]),
        maxZ !== null ? justify(maxZ) : Math.max(min[2], max[2])
      ];
      return new AABB(
        realMin[0],
        realMin[1],
        realMin[2],
        realMax[0],
        realMax[1],
        realMax[2]
      );
    };
    this.value = value;
    this.yRotation = yRotation;
  }
  static {
    /**
     * Encode two rotations into a new block rotation instance.
     *
     * @param value The axis this block is pointing towards.
     * @param yRotation The rotation around the axis this block is pointing towards.
     * @returns A new block rotation.
     */
    this.encode = (value, yRotation = 0) => {
      const yEncoded = yRotation * Math.PI * 2 / Y_ROT_SEGMENTS;
      return new BlockRotation(value, yEncoded);
    };
  }
  static {
    /**
     * Decode a block rotation into two rotations.
     *
     * @param rotation The block rotation to decode.
     * @returns Two values, the first is the axis this block is pointing towards, and
     *   the second is the rotation around that axis.
     */
    this.decode = (rotation) => {
      const value = rotation.value;
      const yDecoded = Math.round(rotation.yRotation * Y_ROT_SEGMENTS / (Math.PI * 2)) % Y_ROT_SEGMENTS;
      return [value, yDecoded];
    };
  }
  static {
    /**
     * Resolve a rotation that may still be in its server-serialized rule shape
     * (`{ "PX": angle }`) into a block rotation instance. Server-authored block
     * rules arrive as raw JSON and are handed to the wasm mesher untouched, so
     * they are normalized here at evaluation time instead of at parse time.
     */
    this.fromServerRotation = (rotation) => {
      if (rotation instanceof BlockRotation) {
        return rotation;
      }
      const axes = [
        ["PY", PY_ROTATION],
        ["NY", NY_ROTATION],
        ["PX", PX_ROTATION],
        ["NX", NX_ROTATION],
        ["PZ", PZ_ROTATION],
        ["NZ", NZ_ROTATION]
      ];
      for (const [axis, value] of axes) {
        const yRotation = rotation[axis];
        if (yRotation !== void 0) {
          return new BlockRotation(value, yRotation);
        }
      }
      throw new Error(
        `Unrecognized block rotation shape in block rule: ${JSON.stringify(
          rotation
        )}`
      );
    };
  }
  rotateTransparency([px, py, pz, nx, ny, nz]) {
    const rot = this.value;
    if (Math.abs(rot) < Number.EPSILON) {
      return [px, py, pz, nx, ny, nz];
    }
    const positive = [1, 2, 3];
    const negative = [4, 5, 6];
    this.rotateNode(positive, true, false);
    this.rotateNode(negative, true, false);
    const p = positive.map((n2) => {
      if (n2 === 1) return px;
      if (n2 === 2) return py;
      if (n2 === 3) return pz;
      if (n2 === 4) return nx;
      if (n2 === 5) return ny;
      return nz;
    });
    const n = negative.map((n2) => {
      if (n2 === 1) return px;
      if (n2 === 2) return py;
      if (n2 === 3) return pz;
      if (n2 === 4) return nx;
      if (n2 === 5) return ny;
      return nz;
    });
    return [p[0], p[1], p[2], n[0], n[1], n[2]];
  }
  static {
    // Reference:
    // https://www.khanacademy.org/computer-programming/cube-rotated-around-x-y-and-z/4930679668473856
    /**
     * Rotate a 3D coordinate around the X axis.
     */
    this.rotateX = (node, theta) => {
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const [, y, z] = node;
      node[1] = y * cosTheta - z * sinTheta;
      node[2] = z * cosTheta + y * sinTheta;
    };
  }
  static {
    /**
     * Rotate a 3D coordinate around the Y axis.
     */
    this.rotateY = (node, theta) => {
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const [x, , z] = node;
      node[0] = x * cosTheta + z * sinTheta;
      node[2] = z * cosTheta - x * sinTheta;
    };
  }
  static {
    /**
     * Rotate a 3D coordinate around the Z axis.
     */
    this.rotateZ = (node, theta) => {
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const [x, y] = node;
      node[0] = x * cosTheta - y * sinTheta;
      node[1] = y * cosTheta + x * sinTheta;
    };
  }
}

const ROTATION_MASK = 4293984255;
const Y_ROTATION_MASK = 4279238655;
const STAGE_MASK = 4043309055;
const WATERLOGGED_BIT = 1 << 28;
const WATERLOGGED_MASK = ~WATERLOGGED_BIT;
const WATERLOG_LEVEL_SHIFT = 29;
class BlockUtils {
  static {
    /**
     * Extract the voxel id from a number.
     *
     * @param voxel The voxel value to extract from.
     * @returns The extracted voxel id.
     */
    this.extractID = (voxel) => {
      return voxel & 65535;
    };
  }
  static {
    /**
     * Insert a voxel id into a number.
     *
     * @param voxel The voxel value to insert the id into.
     * @param id The voxel id to insert.
     * @returns The inserted voxel value.
     */
    this.insertID = (voxel, id) => {
      return voxel & 4294901760 | id & 65535;
    };
  }
  static {
    /**
     * Extract the voxel rotation from a number.
     *
     * @param voxel The voxel value to extract from.
     * @returns The extracted voxel rotation.
     */
    this.extractRotation = (voxel) => {
      const rotation = voxel >> 16 & 15;
      const yRot = voxel >> 20 & 15;
      return BlockRotation.encode(rotation, yRot);
    };
  }
  static {
    /**
     * Insert a voxel rotation into a number.
     *
     * @param voxel The voxel value to insert the rotation into.
     * @param rotation The voxel rotation to insert.
     * @returns The inserted voxel value.
     */
    this.insertRotation = (voxel, rotation) => {
      const [rot, yRot] = BlockRotation.decode(rotation);
      const value = voxel & ROTATION_MASK | (rot & 15) << 16;
      return value & Y_ROTATION_MASK | (yRot & 15) << 20;
    };
  }
  static {
    /**
     * Extract the voxel stage from a number.
     *
     * @param voxel The voxel value to extract from.
     * @returns The extracted voxel stage.
     */
    this.extractStage = (voxel) => {
      return voxel >> 24 & 15;
    };
  }
  static {
    /**
     * Insert a voxel stage into a number.
     *
     * @param voxel The voxel value to insert the stage into.
     * @param stage The voxel stage to insert.
     * @returns The inserted voxel value.
     */
    this.insertStage = (voxel, stage) => {
      return voxel & STAGE_MASK | stage << 24;
    };
  }
  static {
    /**
     * Whether this voxel holds the world's waterlogging fluid alongside its
     * block. Mirrors `BlockUtils::extract_waterlogged` on the server.
     *
     * @param voxel The voxel value to extract from.
     */
    this.extractWaterlogged = (voxel) => {
      return (voxel & WATERLOGGED_BIT) !== 0;
    };
  }
  static {
    /**
     * Insert the waterlogged flag into a voxel value.
     *
     * @param voxel The voxel value to insert the flag into.
     * @param isWaterlogged Whether the voxel holds the waterlogging fluid.
     */
    this.insertWaterlogged = (voxel, isWaterlogged) => {
      return isWaterlogged ? voxel | WATERLOGGED_BIT : voxel & WATERLOGGED_MASK;
    };
  }
  static {
    /**
     * The level of fluid a waterlogged voxel holds, in the same 0-7 range as a
     * fluid block's stage.
     *
     * @param voxel The voxel value to extract from.
     */
    this.extractWaterlogLevel = (voxel) => {
      return voxel >>> WATERLOG_LEVEL_SHIFT & 7;
    };
  }
  static {
    /**
     * Insert the waterlogging fluid's level into a voxel value.
     *
     * The level occupies the top three bits, so the result is normalised back to
     * unsigned: JavaScript's bitwise operators work on signed 32-bit integers
     * and a level of 4 or more would otherwise come back negative.
     *
     * @param voxel The voxel value to insert the level into.
     * @param level The fluid level, 0 through 7.
     */
    this.insertWaterlogLevel = (voxel, level) => {
      return (voxel & 536870911 | (level & 7) << WATERLOG_LEVEL_SHIFT) >>> 0;
    };
  }
  static {
    /**
     * The level of fluid standing in this voxel, wherever it is stored: a
     * waterlogged block keeps its water's level in its own field, a fluid block
     * keeps its own in `stage`. Mirrors `BlockUtils::extract_fluid_level`.
     *
     * @param voxel The voxel value to extract from.
     */
    this.extractFluidLevel = (voxel) => {
      return BlockUtils.extractWaterlogged(voxel) ? BlockUtils.extractWaterlogLevel(voxel) : BlockUtils.extractStage(voxel);
    };
  }
  static {
    this.insertAll = (id, rotation, stage, isWaterlogged, waterlogLevel) => {
      let value = 0;
      value = BlockUtils.insertID(value, id);
      if (rotation) value = BlockUtils.insertRotation(value, rotation);
      if (stage !== void 0) value = BlockUtils.insertStage(value, stage);
      if (isWaterlogged !== void 0)
        value = BlockUtils.insertWaterlogged(value, isWaterlogged);
      if (waterlogLevel !== void 0)
        value = BlockUtils.insertWaterlogLevel(value, waterlogLevel);
      return value;
    };
  }
  static {
    this.getBlockTorchLightLevel = (block, color) => {
      switch (color) {
        case "RED":
          return block.redLightLevel ?? 0;
        case "GREEN":
          return block.greenLightLevel ?? 0;
        case "BLUE":
          return block.blueLightLevel ?? 0;
      }
      return 0;
    };
  }
  static {
    this.getBlockTorchLightLevelAt = (block, color, voxel, functions) => {
      if (block.dynamicPatterns?.length) {
        for (const pattern of block.dynamicPatterns) {
          for (const part of pattern.parts) {
            const isMatch = BlockUtils.evaluateBlockRule(
              part.rule,
              voxel,
              functions
            );
            if (!isMatch) {
              continue;
            }
            switch (color) {
              case "RED":
                if (typeof part.redLightLevel === "number") {
                  return part.redLightLevel;
                }
                break;
              case "GREEN":
                if (typeof part.greenLightLevel === "number") {
                  return part.greenLightLevel;
                }
                break;
              case "BLUE":
                if (typeof part.blueLightLevel === "number") {
                  return part.blueLightLevel;
                }
                break;
            }
          }
        }
      }
      return BlockUtils.getBlockTorchLightLevel(block, color);
    };
  }
  static getBlockRotatedTransparency(block, rotation) {
    if (!block) {
      if (!BlockUtils.hasWarnedMissingTransparencyBlock) {
        BlockUtils.hasWarnedMissingTransparencyBlock = true;
        console.warn(
          "[BlockUtils] getBlockRotatedTransparency received a missing block; treating as opaque."
        );
      }
      return [false, false, false, false, false, false];
    }
    return rotation.rotateTransparency(block.isTransparent);
  }
  static {
    this.hasWarnedMissingTransparencyBlock = false;
  }
  static {
    this.evaluateBlockRule = (rule, voxel, functions) => {
      if (rule.type === "none") {
        return true;
      }
      if (rule.type === "simple") {
        const { offset, id, rotation, stage } = rule;
        const [vx, vy, vz] = voxel;
        const ox = offset[0] + vx;
        const oy = offset[1] + vy;
        const oz = offset[2] + vz;
        if (id !== null) {
          const voxelId = functions.getVoxelAt(ox, oy, oz);
          if (voxelId !== id) return false;
        }
        if (rotation !== null && rotation !== void 0) {
          const expected = BlockRotation.fromServerRotation(rotation);
          const voxelRotation = functions.getVoxelRotationAt(ox, oy, oz);
          const [expectedValue, expectedSegment] = BlockRotation.decode(expected);
          const [actualValue, actualSegment] = BlockRotation.decode(voxelRotation);
          if (actualValue !== expectedValue || actualSegment !== expectedSegment)
            return false;
        }
        if (stage !== null) {
          const voxelStage = functions.getVoxelStageAt(ox, oy, oz);
          if (voxelStage !== stage) return false;
        }
        return true;
      }
      if (rule.type === "combination") {
        const { logic, rules } = rule;
        switch (logic) {
          case BlockRuleLogic.And:
            return rules.every(
              (subRule) => BlockUtils.evaluateBlockRule(subRule, voxel, functions)
            );
          case BlockRuleLogic.Or:
            return rules.some(
              (subRule) => BlockUtils.evaluateBlockRule(subRule, voxel, functions)
            );
          case BlockRuleLogic.Not:
            return !rules.some(
              (subRule) => BlockUtils.evaluateBlockRule(subRule, voxel, functions)
            );
          default:
            return false;
        }
      }
      return false;
    };
  }
  static getBlockEntityId(id, voxel) {
    const [vx, vy, vz] = voxel;
    return `block::${id}::${vx}::${vy}::${vz}`;
  }
  constructor() {
  }
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var epsilon = 0.000001;

var create_1 = create;

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
    var out = new Float32Array(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out
}

var clone_1 = clone;

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function clone(a) {
    var out = new Float32Array(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out
}

var fromValues_1 = fromValues$1;

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues$1(x, y, z) {
    var out = new Float32Array(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out
}

var normalize_1 = normalize$1;

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize$1(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out
}

var dot_1 = dot$1;

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot$1(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

var angle_1 = angle;

var fromValues = fromValues_1;
var normalize = normalize_1;
var dot = dot_1;

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
    var tempA = fromValues(a[0], a[1], a[2]);
    var tempB = fromValues(b[0], b[1], b[2]);
 
    normalize(tempA, tempA);
    normalize(tempB, tempB);
 
    var cosine = dot(tempA, tempB);

    if(cosine > 1.0){
        return 0
    } else {
        return Math.acos(cosine)
    }     
}

var copy_1 = copy;

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out
}

var set_1 = set;

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out
}

var equals_1 = equals;

var EPSILON = epsilon;

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0];
  var a1 = a[1];
  var a2 = a[2];
  var b0 = b[0];
  var b1 = b[1];
  var b2 = b[2];
  return (Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
          Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
          Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)))
}

var exactEquals_1 = exactEquals;

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

var add_1 = add;

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out
}

var subtract_1 = subtract;

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out
}

var sub = subtract_1;

var multiply_1 = multiply;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out
}

var mul = multiply_1;

var divide_1 = divide;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out
}

var div = divide_1;

var min_1 = min;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out
}

var max_1 = max;

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out
}

var floor_1 = floor;

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to floor
 * @returns {vec3} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out
}

var ceil_1 = ceil;

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to ceil
 * @returns {vec3} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out
}

var round_1 = round;

/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to round
 * @returns {vec3} out
 */
function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out
}

var scale_1 = scale;

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out
}

var scaleAndAdd_1 = scaleAndAdd;

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out
}

var distance_1 = distance;

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z)
}

var dist = distance_1;

var squaredDistance_1 = squaredDistance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z
}

var sqrDist = squaredDistance_1;

var length_1 = length;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z)
}

var len = length_1;

var squaredLength_1 = squaredLength;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z
}

var sqrLen = squaredLength_1;

var negate_1 = negate;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out
}

var inverse_1 = inverse;

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out
}

var cross_1 = cross;

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out
}

var lerp_1 = lerp;

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out
}

var random_1 = random;

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
    scale = scale || 1.0;

    var r = Math.random() * 2.0 * Math.PI;
    var z = (Math.random() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out
}

var transformMat4_1 = transformMat4;

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out
}

var transformMat3_1 = transformMat3;

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out
}

var transformQuat_1 = transformQuat;

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out
}

var rotateX_1 = rotateX;

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateX(out, a, b, c){
    var by = b[1];
    var bz = b[2];

    // Translate point to the origin
    var py = a[1] - by;
    var pz = a[2] - bz;

    var sc = Math.sin(c);
    var cc = Math.cos(c);

    // perform rotation and translate to correct position
    out[0] = a[0];
    out[1] = by + py * cc - pz * sc;
    out[2] = bz + py * sc + pz * cc;

    return out
}

var rotateY_1 = rotateY;

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateY(out, a, b, c){
    var bx = b[0];
    var bz = b[2];

    // translate point to the origin
    var px = a[0] - bx;
    var pz = a[2] - bz;
    
    var sc = Math.sin(c);
    var cc = Math.cos(c);
  
    // perform rotation and translate to correct position
    out[0] = bx + pz * sc + px * cc;
    out[1] = a[1];
    out[2] = bz + pz * cc - px * sc;
  
    return out
}

var rotateZ_1 = rotateZ;

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateZ(out, a, b, c){
    var bx = b[0];
    var by = b[1];

    //Translate point to the origin
    var px = a[0] - bx;
    var py = a[1] - by;
  
    var sc = Math.sin(c);
    var cc = Math.cos(c);

    // perform rotation and translate to correct position
    out[0] = bx + px * cc - py * sc;
    out[1] = by + px * sc + py * cc;
    out[2] = a[2];
  
    return out
}

var forEach_1 = forEach;

var vec = create_1();

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
function forEach(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; 
            vec[1] = a[i+1]; 
            vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; 
            a[i+1] = vec[1]; 
            a[i+2] = vec[2];
        }
        
        return a
}

var glVec3 = {
  EPSILON: epsilon
  , create: create_1
  , clone: clone_1
  , angle: angle_1
  , fromValues: fromValues_1
  , copy: copy_1
  , set: set_1
  , equals: equals_1
  , exactEquals: exactEquals_1
  , add: add_1
  , subtract: subtract_1
  , sub: sub
  , multiply: multiply_1
  , mul: mul
  , divide: divide_1
  , div: div
  , min: min_1
  , max: max_1
  , floor: floor_1
  , ceil: ceil_1
  , round: round_1
  , scale: scale_1
  , scaleAndAdd: scaleAndAdd_1
  , distance: distance_1
  , dist: dist
  , squaredDistance: squaredDistance_1
  , sqrDist: sqrDist
  , length: length_1
  , len: len
  , squaredLength: squaredLength_1
  , sqrLen: sqrLen
  , negate: negate_1
  , inverse: inverse_1
  , normalize: normalize_1
  , dot: dot_1
  , cross: cross_1
  , lerp: lerp_1
  , random: random_1
  , transformMat4: transformMat4_1
  , transformMat3: transformMat3_1
  , transformQuat: transformQuat_1
  , rotateX: rotateX_1
  , rotateY: rotateY_1
  , rotateZ: rotateZ_1
  , forEach: forEach_1
};

var vec3 = /*@__PURE__*/getDefaultExportFromCjs(glVec3);

class ChunkUtils {
  static {
    /**
     * Convert a 2D chunk coordinate to a string representation.
     *
     * @param coords The coordinates to convert.
     * @param concat The concatenation string to use.
     * @returns The string representation of the coordinates.
     */
    this.getChunkName = (coords, concat = "|") => {
      return coords[0] + concat + coords[1];
    };
  }
  static {
    /**
     * Convert a 3D voxel coordinate to a string representation.
     *
     * @param coords The coordinates to convert.
     * @param concat The concatenation string to use.
     * @returns The string representation of the coordinates.
     */
    this.getVoxelName = (coords, concat = "|") => {
      return (coords[0] | 0) + concat + (coords[1] | 0) + concat + (coords[2] | 0);
    };
  }
  static {
    /**
     * Given a chunk representation, parse the chunk coordinates.
     *
     * @param name The string representation of the chunk.
     * @param concat The concatenation string used.
     * @returns The parsed chunk coordinates.
     */
    this.parseChunkName = (name, concat = "|") => {
      return name.split(concat).map((s) => parseInt(s, 10));
    };
  }
  static {
    /**
     * Scale and floor a 3D coordinate.
     *
     * @param coords The coordinates to scale and floor.
     * @param factor The factor to scale by.
     * @returns The scaled and floored coordinates.
     */
    this.scaleCoordsF = (coords, factor) => {
      const result = [0, 0, 0];
      const scaled = vec3.scale(result, coords, factor);
      return vec3.floor(scaled, scaled);
    };
  }
  static {
    /**
     * Map a 3D voxel coordinate to the local 3D voxel coordinate in the situated chunk.
     *
     * @param voxelPos The voxel coordinate to map.
     * @param chunkSize The horizontal dimension of a chunk.
     * @returns The mapped coordinate.
     */
    this.mapVoxelToChunkLocal = (voxelPos, chunkSize) => {
      const [cx, cz] = ChunkUtils.mapVoxelToChunk(voxelPos, chunkSize);
      const [vx, vy, vz] = voxelPos;
      return [vx - cx * chunkSize, vy, vz - cz * chunkSize];
    };
  }
  static {
    /**
     * Map a 3D voxel coordinate to the 2D chunk coordinate.
     *
     * @param voxelPos The voxel coordinate to map.
     * @param chunkSize  The horizontal dimension of a chunk.
     * @returns The mapped coordinate.
     */
    this.mapVoxelToChunk = (voxelPos, chunkSize) => {
      const coords3 = ChunkUtils.scaleCoordsF(voxelPos, 1 / chunkSize);
      return [coords3[0], coords3[2]];
    };
  }
  static {
    /**
     * Map a 2D chunk coordinate to the 3D voxel coordinate.
     *
     * @param chunkPos The chunk coordinate to map.
     * @param chunkSize The horizontal dimension of a chunk.
     * @returns The mapped coordinate.
     */
    this.mapChunkToVoxel = (chunkPos, chunkSize) => {
      const result = [0, 0, 0];
      vec3.copy(result, [chunkPos[0], 0, chunkPos[1]]);
      vec3.scale(result, result, chunkSize);
      return result;
    };
  }
  static {
    /**
     * Map a 3D world coordinate to the 3D voxel coordinate. Since a voxel is
     * exactly 1 unit in size, this is just a floor operation.
     *
     * @param worldPos The world coordinate to map.
     * @returns The mapped coordinate.
     */
    this.mapWorldToVoxel = (worldPos) => {
      return ChunkUtils.scaleCoordsF(worldPos, 1);
    };
  }
  constructor() {
  }
}

class LightUtils {
  static {
    /**
     * Extract the sunlight level from a number.
     *
     * @param light The light value to extract from.
     * @returns The extracted sunlight value.
     */
    this.extractSunlight = (light) => {
      return light >> 12 & 15;
    };
  }
  static {
    /**
     * Insert a sunlight level into a number.
     *
     * @param light The light value to insert the level into.
     * @param level The sunlight level to insert.
     * @returns The inserted light value.
     */
    this.insertSunlight = (light, level) => {
      return light & 4095 | level << 12;
    };
  }
  static {
    /**
     * Extract the red light level from a number.
     *
     * @param light The light value to extract from.
     * @returns The extracted red light value.
     */
    this.extractRedLight = (light) => {
      return light >> 8 & 15;
    };
  }
  static {
    /**
     * Insert a red light level into a number.
     *
     * @param light The light value to insert the level into.
     * @param level The red light level to insert.
     * @returns The inserted light value.
     */
    this.insertRedLight = (light, level) => {
      return light & 61695 | level << 8;
    };
  }
  static {
    /**
     * Extract the green light level from a number.
     *
     * @param light The light value to extract from.
     * @returns The extracted green light value.
     */
    this.extractGreenLight = (light) => {
      return light >> 4 & 15;
    };
  }
  static {
    /**
     * Insert a green light level into a number.
     *
     * @param light The light value to insert the level into.
     * @param level The green light level to insert.
     * @returns The inserted light value.
     */
    this.insertGreenLight = (light, level) => {
      return light & 65295 | level << 4;
    };
  }
  static {
    /**
     * Extract the blue light level from a number.
     *
     * @param light The light value to extract from.
     * @returns The extracted blue light value.
     */
    this.extractBlueLight = (light) => {
      return light & 15;
    };
  }
  static {
    /**
     * Insert a blue light level into a number.
     *
     * @param light The light value to insert the level into.
     * @param level The blue light level to insert.
     * @returns The inserted light value.
     */
    this.insertBlueLight = (light, level) => {
      return light & 65520 | level;
    };
  }
  static {
    /**
     * Check to see if light can go "into" one block, disregarding the source.
     *
     * @param target The target block's transparency.
     * @param dx The change in x direction.
     * @param dy The change in y direction.
     * @param dz The change in z direction.
     * @returns Whether light can enter into the target block.
     */
    this.canEnterInto = (target, dx, dy, dz) => {
      if (Math.abs(dx + dy + dz) !== 1) {
        throw new Error(
          "This isn't supposed to happen. Light neighboring direction should be on 1 axis only."
        );
      }
      const [px, py, pz, nx, ny, nz] = target;
      if (dx === 1) {
        return nx;
      }
      if (dx === -1) {
        return px;
      }
      if (dy === 1) {
        return ny;
      }
      if (dy === -1) {
        return py;
      }
      if (dz === 1) {
        return nz;
      }
      return pz;
    };
  }
  static {
    /**
     * Check to see if light can enter from one block to another.
     *
     * @param source The source block's transparency.
     * @param target The target block's transparency.
     * @param dx The change in x direction.
     * @param dy The change in y direction.
     * @param dz The change in z direction.
     * @returns Whether light can enter from the source block to the target block.
     */
    this.canEnter = (source, target, dx, dy, dz) => {
      if (Math.abs(dx + dy + dz) !== 1) {
        throw new Error(
          "This isn't supposed to happen. Light neighboring direction should be on 1 axis only."
        );
      }
      const [spx, spy, spz, snx, sny, snz] = source;
      const [tpx, tpy, tpz, tnx, tny, tnz] = target;
      if (dx === 1) {
        return spx && tnx;
      }
      if (dx === -1) {
        return snx && tpx;
      }
      if (dy === 1) {
        return spy && tny;
      }
      if (dy === -1) {
        return sny && tpy;
      }
      if (dz === 1) {
        return spz && tnz;
      }
      return snz && tpz;
    };
  }
  static dedupeFillQueue(nodes) {
    const byKey = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      const key = `${node.voxel[0]},${node.voxel[1]},${node.voxel[2]}`;
      const existing = byKey.get(key);
      if (!existing || node.level > existing.level) {
        byKey.set(key, node);
      }
    }
    return Array.from(byKey.values());
  }
  static retainLiveFillNodes(nodes, getLevelAt) {
    return nodes.filter(
      (node) => getLevelAt(node.voxel[0], node.voxel[1], node.voxel[2]) === node.level
    );
  }
  /**
   * Beer-Lambert transmission: I' = I * e^(-μd).
   * Each optical-density unit multiplies by 222/256 ≈ e^(-0.143).
   */
  static beerLambertTransmit(level, opticalDensity) {
    if (level <= 0 || opticalDensity <= 0) {
      return level;
    }
    let next = level;
    for (let i = 0; i < opticalDensity; i += 1) {
      next = Math.floor(
        next * LightUtils.BEER_LAMBERT_TRANSMITTANCE_NUM / LightUtils.BEER_LAMBERT_TRANSMITTANCE_DEN
      );
    }
    if (next >= level) {
      return Math.max(level - 1, 0);
    }
    return next;
  }
  /**
   * Next light level when flooding into a neighbor voxel.
   */
  static floodLightNextLevel(isSunlight, lightAttenuation, oy, level, maxLightLevel) {
    if (level <= 0) {
      return 0;
    }
    if (isSunlight && lightAttenuation === 0 && oy === -1 && level === maxLightLevel) {
      return level;
    }
    if (lightAttenuation > 0) {
      return LightUtils.beerLambertTransmit(level, lightAttenuation);
    }
    return Math.max(level - 1, 0);
  }
  static {
    this.BEER_LAMBERT_TRANSMITTANCE_NUM = 222;
  }
  static {
    this.BEER_LAMBERT_TRANSMITTANCE_DEN = 256;
  }
  constructor() {
  }
}

function iota$1(n) {
  var result = new Array(n);
  for(var i=0; i<n; ++i) {
    result[i] = i;
  }
  return result
}

var iota_1 = iota$1;

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
var isBuffer_1 = function (obj) {
  return obj != null && (isBuffer$1(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
};

function isBuffer$1 (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer$1(obj.slice(0, 0))
}

var iota = iota_1;
var isBuffer = isBuffer_1;

var hasTypedArrays  = ((typeof Float64Array) !== "undefined");

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride;
  var terms = new Array(stride.length);
  var i;
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i];
  }
  terms.sort(compare1st);
  var result = new Array(terms.length);
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1];
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("");
  if(dimension < 0) {
    className = "View_Nil" + dtype;
  }
  var useGetters = (dtype === "generic");

  if(dimension === -1) {
    //Special case for trivial arrays
    var code =
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}";
    var procedure = new Function(code);
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}";
    var procedure = new Function("TrivialArray", code);
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"];

  //Create constructor for view
  var indices = iota(dimension);
  var args = indices.map(function(i) { return "i"+i });
  var index_str = "this.offset+" + indices.map(function(i) {
        return "this.stride[" + i + "]*i" + i
      }).join("+");
  var shapeArg = indices.map(function(i) {
      return "b"+i
    }).join(",");
  var strideArg = indices.map(function(i) {
      return "c"+i
    }).join(",");
  code.push(
    "function "+className+"(a," + shapeArg + "," + strideArg + ",d){this.data=a",
      "this.shape=[" + shapeArg + "]",
      "this.stride=[" + strideArg + "]",
      "this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension);

  //view.size:
  code.push("Object.defineProperty(proto,'size',{get:function "+className+"_size(){\
return "+indices.map(function(i) { return "this.shape["+i+"]" }).join("*"),
"}})");

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]");
  } else {
    code.push("Object.defineProperty(proto,'order',{get:");
    if(dimension < 4) {
      code.push("function "+className+"_order(){");
      if(dimension === 2) {
        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})");
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})");
      }
    } else {
      code.push("ORDER})");
    }
  }

  //view.set(i0, ..., v):
  code.push(
"proto.set=function "+className+"_set("+args.join(",")+",v){");
  if(useGetters) {
    code.push("return this.data.set("+index_str+",v)}");
  } else {
    code.push("return this.data["+index_str+"]=v}");
  }

  //view.get(i0, ...):
  code.push("proto.get=function "+className+"_get("+args.join(",")+"){");
  if(useGetters) {
    code.push("return this.data.get("+index_str+")}");
  } else {
    code.push("return this.data["+index_str+"]}");
  }

  //view.index:
  code.push(
    "proto.index=function "+className+"_index(", args.join(), "){return "+index_str+"}");

  //view.hi():
  code.push("proto.hi=function "+className+"_hi("+args.join(",")+"){return new "+className+"(this.data,"+
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this.shape[", i, "]:i", i,"|0"].join("")
    }).join(",")+","+
    indices.map(function(i) {
      return "this.stride["+i + "]"
    }).join(",")+",this.offset)}");

  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this.shape["+i+"]" });
  var c_vars = indices.map(function(i) { return "c"+i+"=this.stride["+i+"]" });
  code.push("proto.lo=function "+className+"_lo("+args.join(",")+"){var b=this.offset,d=0,"+a_vars.join(",")+","+c_vars.join(","));
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'&&i"+i+">=0){\
d=i"+i+"|0;\
b+=c"+i+"*d;\
a"+i+"-=d}");
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",b)}");

  //view.step():
  code.push("proto.step=function "+className+"_step("+args.join(",")+"){var "+
    indices.map(function(i) {
      return "a"+i+"=this.shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "b"+i+"=this.stride["+i+"]"
    }).join(",")+",c=this.offset,d=0,ceil=Math.ceil");
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'){\
d=i"+i+"|0;\
if(d<0){\
c+=b"+i+"*(a"+i+"-1);\
a"+i+"=ceil(-a"+i+"/d)\
}else{\
a"+i+"=ceil(a"+i+"/d)\
}\
b"+i+"*=d\
}");
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a" + i
    }).join(",")+","+
    indices.map(function(i) {
      return "b" + i
    }).join(",")+",c)}");

  //view.transpose():
  var tShape = new Array(dimension);
  var tStride = new Array(dimension);
  for(var i=0; i<dimension; ++i) {
    tShape[i] = "a[i"+i+"]";
    tStride[i] = "b[i"+i+"]";
  }
  code.push("proto.transpose=function "+className+"_transpose("+args+"){"+
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    "var a=this.shape,b=this.stride;return new "+className+"(this.data,"+tShape.join(",")+","+tStride.join(",")+",this.offset)}");

  //view.pick():
  code.push("proto.pick=function "+className+"_pick("+args+"){var a=[],b=[],c=this.offset");
  for(var i=0; i<dimension; ++i) {
    code.push("if(typeof i"+i+"==='number'&&i"+i+">=0){c=(c+this.stride["+i+"]*i"+i+")|0}else{a.push(this.shape["+i+"]);b.push(this.stride["+i+"])}");
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}");

  //Add return statement
  code.push("return function construct_"+className+"(data,shape,stride,offset){return new "+className+"(data,"+
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(",")+",offset)}");

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"));
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(isBuffer(data)) {
    return "buffer"
  }
  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
      case "[object BigInt64Array]":
        return "bigint64"
      case "[object BigUint64Array]":
        return "biguint64"
    }
  }
  if(Array.isArray(data)) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "bigint64": [],
  "biguint64": [],
  "buffer":[],
  "generic":[]
}

;
function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0];
    return ctor([])
  } else if(typeof data === "number") {
    data = [data];
  }
  if(shape === undefined) {
    shape = [ data.length ];
  }
  var d = shape.length;
  if(stride === undefined) {
    stride = new Array(d);
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz;
      sz *= shape[i];
    }
  }
  if(offset === undefined) {
    offset = 0;
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i];
      }
    }
  }
  var dtype = arrayDType(data);
  var ctor_list = CACHED_CONSTRUCTORS[dtype];
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1));
  }
  var ctor = ctor_list[d+1];
  return ctor(data, shape, stride, offset)
}

var ndarray = wrappedNDArrayCtor;

var ndarray$1 = /*@__PURE__*/getDefaultExportFromCjs(ndarray);

const DEFAULT_MAX_SLOTS = 512;
class ChunkSharedPool {
  constructor(maxSlots) {
    this.buffer = null;
    this.elementCountPerSlot = 0;
    this.slots = /* @__PURE__ */ new Map();
    this.freeSlotIndices = [];
    this.maxSlots = maxSlots;
  }
  static {
    this.instance = null;
  }
  static getInstance() {
    if (!ChunkSharedPool.instance) {
      ChunkSharedPool.instance = new ChunkSharedPool(DEFAULT_MAX_SLOTS);
    }
    return ChunkSharedPool.instance;
  }
  static resetForTests() {
    ChunkSharedPool.instance = null;
  }
  static isSharedArrayBufferAvailable() {
    return typeof SharedArrayBuffer !== "undefined" && typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
  }
  getStats() {
    return {
      isActive: this.buffer !== null,
      maxSlots: this.maxSlots,
      usedSlots: this.slots.size,
      bytesAllocated: this.buffer?.byteLength ?? 0
    };
  }
  hasSlot(key) {
    return this.slots.has(key);
  }
  ensureChunk(chunk) {
    if (!ChunkSharedPool.isSharedArrayBufferAvailable()) {
      return false;
    }
    const key = chunk.name;
    if (this.slots.has(key)) {
      return true;
    }
    if (!chunk.isReady) {
      return false;
    }
    const elementCount = chunk.voxels.data.length;
    if (elementCount === 0) {
      return false;
    }
    if (!this.buffer || this.elementCountPerSlot !== elementCount) {
      if (this.slots.size > 0) {
        return false;
      }
      this.initializeBuffer(elementCount);
    }
    const slotIndex = this.allocateSlotIndex();
    if (slotIndex === null) {
      return false;
    }
    const bytesPerArray = elementCount * Uint32Array.BYTES_PER_ELEMENT;
    const voxelsByteOffset = slotIndex * bytesPerArray * 2;
    const lightsByteOffset = voxelsByteOffset + bytesPerArray;
    if (!this.buffer) {
      return false;
    }
    const voxelsView = new Uint32Array(
      this.buffer,
      voxelsByteOffset,
      elementCount
    );
    const lightsView = new Uint32Array(
      this.buffer,
      lightsByteOffset,
      elementCount
    );
    voxelsView.set(chunk.voxels.data);
    lightsView.set(chunk.lights.data);
    chunk.voxels.data = voxelsView;
    chunk.lights.data = lightsView;
    this.slots.set(key, {
      key,
      elementCount,
      voxelsByteOffset,
      lightsByteOffset
    });
    return true;
  }
  releaseChunk(key) {
    const slot = this.slots.get(key);
    if (!slot) return;
    const slotIndex = slot.voxelsByteOffset / (slot.elementCount * 8);
    this.freeSlotIndices.push(slotIndex);
    this.slots.delete(key);
  }
  initializeBuffer(elementCount) {
    const bytesPerArray = elementCount * Uint32Array.BYTES_PER_ELEMENT;
    const bytesPerSlot = bytesPerArray * 2;
    const totalBytes = bytesPerSlot * this.maxSlots;
    this.buffer = new SharedArrayBuffer(totalBytes);
    this.elementCountPerSlot = elementCount;
    this.freeSlotIndices = Array.from({ length: this.maxSlots }, (_, i) => i);
    this.slots.clear();
  }
  allocateSlotIndex() {
    if (this.freeSlotIndices.length === 0) {
      return null;
    }
    return this.freeSlotIndices.pop() ?? null;
  }
}

const defaultConfig = {
  mode: "auto",
  maxRecentSamples: 64
};
class WorkerTransfer {
  static {
    this.config = { ...defaultConfig };
  }
  static {
    this.forcedStrategy = null;
  }
  static {
    this.statsByStrategy = /* @__PURE__ */ new Map([
      ["transfer", WorkerTransfer.emptyStats("transfer")],
      ["shared", WorkerTransfer.emptyStats("shared")]
    ]);
  }
  static configure(config) {
    WorkerTransfer.config = { ...WorkerTransfer.config, ...config };
    if (config.mode === "transfer" || config.mode === "shared") {
      WorkerTransfer.forcedStrategy = config.mode;
    } else if (config.mode === "auto") {
      WorkerTransfer.forcedStrategy = null;
    }
  }
  static getMode() {
    return WorkerTransfer.config.mode;
  }
  static isSharedArrayBufferAvailable() {
    return ChunkSharedPool.isSharedArrayBufferAvailable();
  }
  static getStrategy() {
    if (WorkerTransfer.forcedStrategy) {
      return WorkerTransfer.forcedStrategy;
    }
    return WorkerTransfer.isSharedArrayBufferAvailable() ? "shared" : "transfer";
  }
  static setStrategy(strategy) {
    WorkerTransfer.forcedStrategy = strategy;
    WorkerTransfer.config.mode = strategy;
  }
  static getStats(strategy) {
    if (strategy) {
      const stats = WorkerTransfer.statsByStrategy.get(strategy);
      if (!stats) {
        return WorkerTransfer.emptyStats(strategy);
      }
      return stats;
    }
    return {
      transfer: WorkerTransfer.statsByStrategy.get("transfer") ?? WorkerTransfer.emptyStats("transfer"),
      shared: WorkerTransfer.statsByStrategy.get("shared") ?? WorkerTransfer.emptyStats("shared")
    };
  }
  static resetStats() {
    WorkerTransfer.statsByStrategy.set(
      "transfer",
      WorkerTransfer.emptyStats("transfer")
    );
    WorkerTransfer.statsByStrategy.set(
      "shared",
      WorkerTransfer.emptyStats("shared")
    );
  }
  static recordSample(sample) {
    const stats = WorkerTransfer.statsByStrategy.get(sample.strategy) ?? WorkerTransfer.emptyStats(sample.strategy);
    WorkerTransfer.statsByStrategy.set(sample.strategy, stats);
    stats.jobCount += 1;
    stats.totalSerializeMs += sample.serializeMs;
    stats.totalWorkerMs += sample.workerMs;
    stats.totalInputBytes += sample.inputBytes;
    stats.totalOutputBytes += sample.outputBytes;
    stats.recentSamples.push(sample);
    const overflow = stats.recentSamples.length - WorkerTransfer.config.maxRecentSamples;
    if (overflow > 0) {
      stats.recentSamples.splice(0, overflow);
    }
  }
  static summarizeIterations(strategy, warmupIterations, measuredIterations) {
    const totals = measuredIterations.map((iteration) => iteration.totalMs);
    const sortedTotals = [...totals].sort((a, b) => a - b);
    const count = measuredIterations.length || 1;
    const sum = (values) => values.reduce((acc, value) => acc + value, 0);
    return {
      strategy,
      isSharedArrayBufferAvailable: WorkerTransfer.isSharedArrayBufferAvailable(),
      warmupIterations,
      measuredIterations: measuredIterations.length,
      iterations: measuredIterations,
      avgSerializeMs: sum(measuredIterations.map((iteration) => iteration.serializeMs)) / count,
      avgWorkerMs: sum(measuredIterations.map((iteration) => iteration.workerMs)) / count,
      avgTotalMs: sum(totals) / count,
      p50TotalMs: WorkerTransfer.percentile(sortedTotals, 0.5),
      p95TotalMs: WorkerTransfer.percentile(sortedTotals, 0.95),
      totalInputBytes: sum(
        measuredIterations.map((iteration) => iteration.inputBytes)
      ),
      totalOutputBytes: sum(
        measuredIterations.map((iteration) => iteration.outputBytes)
      )
    };
  }
  static buildComparison(cx, cz, level, transfer, shared) {
    const speedup = shared.avgTotalMs > 0 ? transfer.avgTotalMs / shared.avgTotalMs : 1;
    const serializeSpeedup = shared.avgSerializeMs > 0 ? transfer.avgSerializeMs / shared.avgSerializeMs : 1;
    return {
      cx,
      cz,
      level,
      transfer,
      shared,
      speedup,
      serializeSpeedup
    };
  }
  static emptyStats(strategy) {
    return {
      strategy,
      jobCount: 0,
      totalSerializeMs: 0,
      totalWorkerMs: 0,
      totalInputBytes: 0,
      totalOutputBytes: 0,
      recentSamples: []
    };
  }
  static percentile(sortedValues, quantile) {
    if (sortedValues.length === 0) return 0;
    const index = Math.min(
      sortedValues.length - 1,
      Math.max(0, Math.ceil(sortedValues.length * quantile) - 1)
    );
    return sortedValues[index] ?? 0;
  }
}

class RawChunk {
  constructor(id, coords, options) {
    this.id = id;
    this.name = ChunkUtils.getChunkName(coords);
    this.coords = coords;
    this.options = options;
    const { size, maxHeight } = options;
    this.voxels = ndarray$1(new Uint32Array(0), [size, maxHeight, size]);
    this.lights = ndarray$1(new Uint32Array(0), [size, maxHeight, size]);
    const [x, z] = coords;
    this.min = [x * size, 0, z * size];
    this.max = [(x + 1) * size, maxHeight, (z + 1) * size];
  }
  static copyToTransferableArrayBuffer(source, byteOffset, byteLength) {
    const view = new Uint8Array(source, byteOffset, byteLength);
    const copy = new ArrayBuffer(byteLength);
    new Uint8Array(copy).set(view);
    return copy;
  }
  serialize() {
    const strategy = WorkerTransfer.getStrategy();
    if (strategy === "shared") {
      ChunkSharedPool.getInstance().ensureChunk(this);
    }
    const isSharedBacked = strategy === "shared" && typeof SharedArrayBuffer !== "undefined" && this.voxels.data.buffer instanceof SharedArrayBuffer;
    if (isSharedBacked) {
      return [
        {
          id: this.id,
          x: this.coords[0],
          z: this.coords[1],
          voxels: this.voxels.data.buffer,
          voxelsByteOffset: this.voxels.data.byteOffset,
          voxelsLength: this.voxels.data.length,
          lights: this.lights.data.buffer,
          lightsByteOffset: this.lights.data.byteOffset,
          lightsLength: this.lights.data.length,
          transferMode: "shared",
          options: this.options
        },
        []
      ];
    }
    const voxelsCopy = RawChunk.copyToTransferableArrayBuffer(
      this.voxels.data.buffer,
      this.voxels.data.byteOffset,
      this.voxels.data.byteLength
    );
    const lightsCopy = RawChunk.copyToTransferableArrayBuffer(
      this.lights.data.buffer,
      this.lights.data.byteOffset,
      this.lights.data.byteLength
    );
    return [
      {
        id: this.id,
        x: this.coords[0],
        z: this.coords[1],
        voxels: voxelsCopy,
        lights: lightsCopy,
        transferMode: "transfer",
        options: this.options
      },
      [voxelsCopy, lightsCopy]
    ];
  }
  static makeUint32View(buffer, byteOffset, length) {
    const resolvedByteOffset = byteOffset ?? 0;
    const resolvedLength = length ?? (buffer.byteLength - resolvedByteOffset) / Uint32Array.BYTES_PER_ELEMENT;
    return new Uint32Array(buffer, resolvedByteOffset, resolvedLength);
  }
  static makeWorkerArray(buffer, shouldCopy, byteOffset, length) {
    const view = RawChunk.makeUint32View(buffer, byteOffset, length);
    return shouldCopy ? new Uint32Array(view) : view;
  }
  static deserialize(data) {
    const {
      id,
      x,
      z,
      voxels,
      lights,
      options,
      voxelsByteOffset,
      voxelsLength,
      lightsByteOffset,
      lightsLength,
      transferMode
    } = data;
    const chunk = new RawChunk(id, [x, z], options);
    const shouldCopySharedData = transferMode === "shared";
    if (lights && lights.byteLength)
      chunk.lights.data = RawChunk.makeWorkerArray(
        lights,
        shouldCopySharedData,
        lightsByteOffset,
        lightsLength
      );
    if (voxels && voxels.byteLength)
      chunk.voxels.data = RawChunk.makeWorkerArray(
        voxels,
        shouldCopySharedData,
        voxelsByteOffset,
        voxelsLength
      );
    return chunk;
  }
  setData(data) {
    const { id, x, z } = data;
    if (this.id !== id) {
      throw new Error("Chunk id mismatch");
    }
    if (this.coords[0] !== x || this.coords[1] !== z) {
      throw new Error("Chunk coords mismatch");
    }
    const { voxels, lights } = data;
    if (lights && lights.byteLength) this.lights.data = new Uint32Array(lights);
    if (voxels && voxels.byteLength) this.voxels.data = new Uint32Array(voxels);
  }
  /**
   * Get the raw voxel value at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The raw voxel value at the given voxel coordinate. If the voxel is not within
   * the chunk, this method returns `0`.
   */
  getRawValue(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.get(lx, ly, lz);
  }
  /**
   * Set the raw voxel value at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param value The raw voxel value to set at the given voxel coordinate.
   * @returns The raw voxel value at the given voxel coordinate.
   */
  setRawValue(vx, vy, vz, val) {
    if (!this.contains(vx, vy, vz)) return 0;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.set(lx, ly, lz, val);
  }
  /**
   * Get the raw light value at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The raw light value at the given voxel coordinate.
   */
  getRawLight(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) return 0;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.lights.get(lx, ly, lz);
  }
  /**
   * Set the raw light value at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param level The raw light level to set at the given voxel coordinate.
   * @returns The raw light level at the given voxel coordinate.
   */
  setRawLight(vx, vy, vz, level) {
    if (!this.contains(vx, vy, vz)) return 0;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.lights.set(lx, ly, lz, level);
  }
  /**
   * Get the voxel type ID at a given voxel or world coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The voxel type ID at the given voxel coordinate.
   */
  getVoxel(vx, vy, vz) {
    return BlockUtils.extractID(this.getRawValue(vx | 0, vy | 0, vz | 0));
  }
  /**
   * Set the voxel type ID at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param id The voxel type ID to set at the given voxel coordinate.
   * @returns The voxel type ID at the given voxel coordinate.
   */
  setVoxel(vx, vy, vz, id) {
    const value = BlockUtils.insertID(0, id);
    this.setRawValue(vx, vy, vz, value);
    return id;
  }
  /**
   * Get the voxel rotation at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The voxel rotation at the given voxel coordinate.
   */
  getVoxelRotation(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) return new BlockRotation();
    return BlockUtils.extractRotation(this.getRawValue(vx, vy, vz));
  }
  /**
   * Set the voxel rotation at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param rotation The voxel rotation to set at the given voxel coordinate.
   */
  setVoxelRotation(vx, vy, vz, rotation) {
    const value = BlockUtils.insertRotation(
      this.getRawValue(vx, vy, vz),
      rotation
    );
    this.setRawValue(vx, vy, vz, value);
  }
  /**
   * Get the voxel stage at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The voxel stage at the given voxel coordinate.
   */
  getVoxelStage(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) return 0;
    return BlockUtils.extractStage(this.getRawValue(vx, vy, vz));
  }
  /**
   * Set the voxel stage at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param stage The voxel stage to set at the given voxel coordinate.
   * @returns The voxel stage at the given voxel coordinate.
   */
  setVoxelStage(vx, vy, vz, stage) {
    const value = BlockUtils.insertStage(this.getRawValue(vx, vy, vz), stage);
    this.setRawValue(vx, vy, vz, value);
    return stage;
  }
  /**
   * Whether the voxel at a given coordinate holds the world's waterlogging
   * fluid alongside its block.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   */
  getVoxelWaterlogged(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) return false;
    return BlockUtils.extractWaterlogged(this.getRawValue(vx, vy, vz));
  }
  /**
   * Set whether the voxel at a given coordinate holds the waterlogging fluid.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param isWaterlogged Whether the voxel holds the waterlogging fluid.
   */
  setVoxelWaterlogged(vx, vy, vz, isWaterlogged) {
    const value = BlockUtils.insertWaterlogged(
      this.getRawValue(vx, vy, vz),
      isWaterlogged
    );
    this.setRawValue(vx, vy, vz, value);
    return isWaterlogged;
  }
  /**
   * The level of waterlogging fluid held by the voxel at a given coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   */
  getVoxelWaterlogLevel(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) return 0;
    return BlockUtils.extractWaterlogLevel(this.getRawValue(vx, vy, vz));
  }
  /**
   * Set the level of waterlogging fluid held by the voxel at a coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @param level The fluid level, 0 through 7.
   */
  setVoxelWaterlogLevel(vx, vy, vz, level) {
    const value = BlockUtils.insertWaterlogLevel(
      this.getRawValue(vx, vy, vz),
      level
    );
    this.setRawValue(vx, vy, vz, value);
    return level;
  }
  /**
   * Get the red light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate.
   * @param vy The y voxel coordinate.
   * @param vz The z voxel coordinate.
   * @returns The red light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getRedLight(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalRedLight(lx, ly, lz);
  }
  /**
   * Set the red light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The red light level to set at the given voxel coordinate.
   * @returns The red light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setRedLight(vx, vy, vz, level) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalRedLight(lx, ly, lz, level);
  }
  /**
   * Get the green light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The green light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getGreenLight(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalGreenLight(lx, ly, lz);
  }
  /**
   * Set the green light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The green light level to set at the given voxel coordinate.
   * @returns The green light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setGreenLight(vx, vy, vz, level) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalGreenLight(lx, ly, lz, level);
  }
  /**
   * Get the blue light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The blue light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getBlueLight(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalBlueLight(lx, ly, lz);
  }
  /**
   * Set the blue light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The blue light level to set at the given voxel coordinate.
   * @returns The blue light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setBlueLight(vx, vy, vz, level) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalBlueLight(lx, ly, lz, level);
  }
  /**
   * Get the colored torch light level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param color The color of the light to get at the given voxel coordinate.
   * @returns The light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getTorchLight(vx, vy, vz, color) {
    switch (color) {
      case "RED":
        return this.getRedLight(vx, vy, vz);
      case "GREEN":
        return this.getGreenLight(vx, vy, vz);
      case "BLUE":
        return this.getBlueLight(vx, vy, vz);
      default:
        throw new Error("Received unknown light color...");
    }
  }
  /**
   * Set the colored torch light level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The light level to set at the given voxel coordinate.
   * @param color The color of the light to set at the given voxel coordinate.
   * @returns The light level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setTorchLight(vx, vy, vz, level, color) {
    switch (color) {
      case "RED":
        return this.setRedLight(vx, vy, vz, level);
      case "GREEN":
        return this.setGreenLight(vx, vy, vz, level);
      case "BLUE":
        return this.setBlueLight(vx, vy, vz, level);
      default:
        throw new Error("Received unknown light color...");
    }
  }
  /**
   * Get the sunlight level at a given voxel coordinate.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @returns The sunlight level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  getSunlight(vx, vy, vz) {
    if (!this.contains(vx, vy, vz)) {
      if (vy < 0) {
        return 0;
      }
      return this.options.maxLightLevel;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalSunlight(lx, ly, lz);
  }
  /**
   * Set the sunlight level at a given voxel coordinate.
   *
   * Note: This method is purely client-side and does not affect the actual values on the server.
   *
   * @param vx The x voxel coordinate
   * @param vy The y voxel coordinate
   * @param vz The z voxel coordinate
   * @param level The sunlight level to set at the given voxel coordinate.
   * @returns The sunlight level at the given voxel coordinate. If the voxel coordinate is out of bounds, returns 0.
   */
  setSunlight(vx, vy, vz, level) {
    if (!this.contains(vx, vy, vz)) {
      return 0;
    }
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.setLocalSunlight(lx, ly, lz, level);
  }
  /**
   * Whether or not is this chunk ready to be rendered and seen in the world.
   */
  get isReady() {
    return this.lights.data.length !== 0 && this.voxels.data.length !== 0;
  }
  getLocalRedLight(lx, ly, lz) {
    return LightUtils.extractRedLight(this.lights.get(lx, ly, lz));
  }
  setLocalRedLight(lx, ly, lz, level) {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertRedLight(this.lights.get(lx, ly, lz), level)
    );
  }
  getLocalGreenLight(lx, ly, lz) {
    return LightUtils.extractGreenLight(this.lights.get(lx, ly, lz));
  }
  setLocalGreenLight(lx, ly, lz, level) {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertGreenLight(this.lights.get(lx, ly, lz), level)
    );
  }
  getLocalBlueLight(lx, ly, lz) {
    return LightUtils.extractBlueLight(this.lights.get(lx, ly, lz));
  }
  setLocalBlueLight(lx, ly, lz, level) {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertBlueLight(this.lights.get(lx, ly, lz), level)
    );
  }
  getLocalSunlight(lx, ly, lz) {
    return LightUtils.extractSunlight(this.lights.get(lx, ly, lz));
  }
  setLocalSunlight(lx, ly, lz, level) {
    return this.lights.set(
      lx,
      ly,
      lz,
      LightUtils.insertSunlight(this.lights.get(lx, ly, lz), level)
    );
  }
  toLocal(vx, vy, vz) {
    const [mx, my, mz] = this.min;
    return [(vx | 0) - mx, (vy | 0) - my, (vz | 0) - mz];
  }
  contains(vx, vy, vz) {
    const { size, maxHeight } = this.options;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return lx >= 0 && lx < size && ly >= 0 && ly < maxHeight && lz >= 0 && lz < size;
  }
}

class Registry {
  /**
   * @hidden
   */
  constructor() {
    this.blocksByName = /* @__PURE__ */ new Map();
    this.blocksById = /* @__PURE__ */ new Map();
    this.nameMap = /* @__PURE__ */ new Map();
    this.idMap = /* @__PURE__ */ new Map();
  }
  serialize() {
    const serializeAabb = (aabb) => ({
      minX: aabb.minX,
      minY: aabb.minY,
      minZ: aabb.minZ,
      maxX: aabb.maxX,
      maxY: aabb.maxY,
      maxZ: aabb.maxZ
    });
    const serializeBlock = (block) => {
      const {
        dynamicFn,
        aabbs,
        dynamicPatterns,
        independentFaces,
        isolatedFaces,
        ...rest
      } = block;
      return {
        ...rest,
        aabbs: aabbs.map(serializeAabb),
        dynamicPatterns: dynamicPatterns?.map((pattern) => ({
          parts: pattern.parts.map((part) => ({
            ...part,
            aabbs: part.aabbs.map(serializeAabb)
          }))
        }))
      };
    };
    return {
      blocksByName: Array.from(this.blocksByName.entries()).map(
        ([name, block]) => [name, serializeBlock(block)]
      ),
      blocksById: Array.from(this.blocksById.entries()).map(([id, block]) => [
        id,
        serializeBlock(block)
      ]),
      nameMap: Array.from(this.nameMap.entries()),
      idMap: Array.from(this.idMap.entries())
    };
  }
  static deserialize(data) {
    const registry = new Registry();
    registry.blocksByName = new Map(data.blocksByName);
    registry.blocksById = new Map(data.blocksById);
    registry.nameMap = new Map(data.nameMap);
    registry.idMap = new Map(data.idMap);
    return registry;
  }
}

let registry;
const warnedUnknownBlockIds = /* @__PURE__ */ new Set();
function resolveBlockOrAir(id) {
  const block = registry.blocksById.get(id);
  if (block) {
    return block;
  }
  if (!warnedUnknownBlockIds.has(id)) {
    warnedUnknownBlockIds.add(id);
    console.warn(`[light-worker] Unknown block id ${id}; treating as air.`);
  }
  return registry.blocksById.get(0) ?? null;
}
const VOXEL_NEIGHBORS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1],
  [0, 1, 0],
  [0, -1, 0]
];
const ALL_TRANSPARENT = [true, true, true, true, true, true];
class BoundedSpace {
  constructor(chunkGrid, gridWidth, gridDepth, gridOffsetX, gridOffsetZ, chunkSize) {
    this.chunkGrid = chunkGrid;
    this.gridWidth = gridWidth;
    this.gridDepth = gridDepth;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetZ = gridOffsetZ;
    this.chunkSize = chunkSize;
    this.chunkCache = /* @__PURE__ */ new Map();
    this.modifiedChunks = /* @__PURE__ */ new Map();
  }
  hashChunkCoords(cx, cz) {
    return (cx * 73856093 ^ cz * 83492791) >>> 0;
  }
  getChunkByCoords(cx, cz) {
    const localX = cx - this.gridOffsetX;
    const localZ = cz - this.gridOffsetZ;
    if (localX < 0 || localX >= this.gridWidth || localZ < 0 || localZ >= this.gridDepth) {
      return null;
    }
    return this.chunkGrid[localX][localZ];
  }
  getCachedChunk(cx, cz) {
    const key = this.hashChunkCoords(cx, cz);
    let chunk = this.chunkCache.get(key);
    if (chunk === void 0) {
      chunk = this.getChunkByCoords(cx, cz);
      this.chunkCache.set(key, chunk);
    }
    return chunk;
  }
  recordModifiedChunk(cx, cz, vy) {
    const chunk = this.getCachedChunk(cx, cz);
    if (!chunk) {
      return;
    }
    const key = this.hashChunkCoords(cx, cz);
    const existing = this.modifiedChunks.get(key);
    if (!existing) {
      this.modifiedChunks.set(key, { chunk, minY: vy, maxY: vy });
      return;
    }
    existing.minY = Math.min(existing.minY, vy);
    existing.maxY = Math.max(existing.maxY, vy);
  }
  getVoxelAt(vx, vy, vz) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    return chunk?.getVoxel(vx, vy, vz) ?? 0;
  }
  getVoxelRotationAt(vx, vy, vz) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    return chunk?.getVoxelRotation(vx, vy, vz) ?? new BlockRotation();
  }
  getVoxelStageAt(vx, vy, vz) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    return chunk?.getVoxelStage(vx, vy, vz) ?? 0;
  }
  getSunlightAt(vx, vy, vz) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    return chunk?.getSunlight(vx, vy, vz) ?? 0;
  }
  getTorchLightAt(vx, vy, vz, color) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    return chunk?.getTorchLight(vx, vy, vz, color) ?? 0;
  }
  setSunlightAt(vx, vy, vz, level) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    if (chunk) {
      chunk.setSunlight(vx, vy, vz, level);
      this.recordModifiedChunk(cx, cz, vy);
    }
  }
  setTorchLightAt(vx, vy, vz, level, color) {
    const [cx, cz] = ChunkUtils.mapVoxelToChunk([vx, vy, vz], this.chunkSize);
    const chunk = this.getCachedChunk(cx, cz);
    if (chunk) {
      chunk.setTorchLight(vx, vy, vz, level, color);
      this.recordModifiedChunk(cx, cz, vy);
    }
  }
  getModifiedChunks() {
    return Array.from(this.modifiedChunks.values());
  }
}
const QUEUE_COMPACT_INTERVAL = 8192;
const VOXEL_CACHE_LIMIT = 1 << 19;
const MAX_NODES_PER_VOLUME = 4;
function nodeBudgetFor(min, max) {
  if (!min || !max) return Number.POSITIVE_INFINITY;
  const volume = Math.max(1, max[0] - min[0]) * Math.max(1, max[1] - min[1]) * Math.max(1, max[2] - min[2]);
  return volume * MAX_NODES_PER_VOLUME;
}
function floodLight(space, queue, color, min, max, options) {
  const { maxHeight, minChunk, maxChunk, maxLightLevel, chunkSize } = options;
  const [startCX, startCZ] = minChunk;
  const [endCX, endCZ] = maxChunk;
  const isSunlight = color === "SUNLIGHT";
  const blockCache = /* @__PURE__ */ new Map();
  const rotationCache = /* @__PURE__ */ new Map();
  const hashCoords = (vx, vy, vz) => {
    return (vx * 73856093 ^ vy * 19349663 ^ vz * 83492791) >>> 0;
  };
  const getCachedBlock = (vx, vy, vz) => {
    const key = hashCoords(vx, vy, vz);
    let block = blockCache.get(key);
    if (block === void 0) {
      const id = space.getVoxelAt(vx, vy, vz);
      block = resolveBlockOrAir(id);
      if (blockCache.size >= VOXEL_CACHE_LIMIT) blockCache.clear();
      blockCache.set(key, block);
    }
    return block;
  };
  const getCachedRotation = (vx, vy, vz) => {
    const key = hashCoords(vx, vy, vz);
    let rotation = rotationCache.get(key);
    if (!rotation) {
      rotation = space.getVoxelRotationAt(vx, vy, vz);
      if (rotationCache.size >= VOXEL_CACHE_LIMIT) rotationCache.clear();
      rotationCache.set(key, rotation);
    }
    return rotation;
  };
  const nodeBudget = nodeBudgetFor(min, max);
  let processedNodes = 0;
  let head = 0;
  while (head < queue.length) {
    if (head >= QUEUE_COMPACT_INTERVAL) {
      queue.splice(0, head);
      head = 0;
    }
    if (++processedNodes > nodeBudget) {
      console.warn(
        `[light-worker] flood exceeded node budget (${nodeBudget}); bailing with partial light`
      );
      break;
    }
    const { voxel, level } = queue[head++];
    if (level === 0) {
      continue;
    }
    const [vx, vy, vz] = voxel;
    const sourceBlock = getCachedBlock(vx, vy, vz);
    if (!sourceBlock) {
      continue;
    }
    const sourceRotation = getCachedRotation(vx, vy, vz);
    const sourceTransparency = !isSunlight && BlockUtils.getBlockTorchLightLevelAt(sourceBlock, color, voxel, {
      getVoxelAt: (x, y, z) => space.getVoxelAt(x, y, z),
      getVoxelRotationAt: (x, y, z) => space.getVoxelRotationAt(x, y, z),
      getVoxelStageAt: (x, y, z) => space.getVoxelStageAt(x, y, z)
    }) > 0 ? ALL_TRANSPARENT : BlockUtils.getBlockRotatedTransparency(sourceBlock, sourceRotation);
    for (const [ox, oy, oz] of VOXEL_NEIGHBORS) {
      const nvy = vy + oy;
      if (nvy < 0 || nvy >= maxHeight) {
        continue;
      }
      const nvx = vx + ox;
      const nvz = vz + oz;
      const [ncx, ncz] = ChunkUtils.mapVoxelToChunk([nvx, nvy, nvz], chunkSize);
      if (ncx < startCX || ncx > endCX || ncz < startCZ || ncz > endCZ || min && (nvx < min[0] || nvz < min[2]) || max && (nvx >= max[0] || nvz >= max[2])) {
        continue;
      }
      const nextVoxel = [nvx, nvy, nvz];
      const nBlock = getCachedBlock(nvx, nvy, nvz);
      if (!nBlock) {
        continue;
      }
      const nRotation = getCachedRotation(nvx, nvy, nvz);
      const nTransparency = BlockUtils.getBlockRotatedTransparency(
        nBlock,
        nRotation
      );
      const nextLevel = LightUtils.floodLightNextLevel(
        isSunlight,
        nBlock.lightAttenuation,
        oy,
        level,
        maxLightLevel
      );
      if (nextLevel <= 0) {
        continue;
      }
      if (!LightUtils.canEnter(sourceTransparency, nTransparency, ox, oy, oz) || (isSunlight ? space.getSunlightAt(nvx, nvy, nvz) : space.getTorchLightAt(nvx, nvy, nvz, color)) >= nextLevel) {
        continue;
      }
      if (isSunlight) {
        space.setSunlightAt(nvx, nvy, nvz, nextLevel);
      } else {
        space.setTorchLightAt(nvx, nvy, nvz, nextLevel, color);
      }
      queue.push({ voxel: nextVoxel, level: nextLevel });
    }
  }
}
function removeLightsBatch(space, voxels, color, min, max, options) {
  if (!voxels.length) return [];
  const { maxHeight, maxLightLevel } = options;
  const fill = [];
  const queue = [];
  const isSunlight = color === "SUNLIGHT";
  voxels.forEach(([vx, vy, vz]) => {
    const level = isSunlight ? space.getSunlightAt(vx, vy, vz) : space.getTorchLightAt(vx, vy, vz, color);
    if (level === 0) return;
    queue.push({ voxel: [vx, vy, vz], level });
    if (isSunlight) {
      space.setSunlightAt(vx, vy, vz, 0);
    } else {
      space.setTorchLightAt(vx, vy, vz, 0, color);
    }
  });
  const nodeBudget = nodeBudgetFor(min, max);
  let processedNodes = 0;
  let head = 0;
  while (head < queue.length) {
    if (head >= QUEUE_COMPACT_INTERVAL) {
      queue.splice(0, head);
      head = 0;
    }
    if (++processedNodes > nodeBudget) {
      console.warn(
        `[light-worker] removal exceeded node budget (${nodeBudget}); bailing with partial light`
      );
      break;
    }
    const { voxel, level } = queue[head++];
    const [vx, vy, vz] = voxel;
    for (const [ox, oy, oz] of VOXEL_NEIGHBORS) {
      const nvy = vy + oy;
      if (nvy < 0 || nvy >= maxHeight) continue;
      const nvx = vx + ox;
      const nvz = vz + oz;
      const nBlockId = space.getVoxelAt(nvx, nvy, nvz);
      const nBlock = resolveBlockOrAir(nBlockId);
      if (!nBlock) continue;
      const rotation = space.getVoxelRotationAt(nvx, nvy, nvz);
      const nTransparency = BlockUtils.getBlockRotatedTransparency(
        nBlock,
        rotation
      );
      const nVoxel = [nvx, nvy, nvz];
      const dynamicTorchLightLevel = BlockUtils.getBlockTorchLightLevelAt(
        nBlock,
        color,
        nVoxel,
        {
          getVoxelAt: (x, y, z) => space.getVoxelAt(x, y, z),
          getVoxelRotationAt: (x, y, z) => space.getVoxelRotationAt(x, y, z),
          getVoxelStageAt: (x, y, z) => space.getVoxelStageAt(x, y, z)
        }
      );
      const nl = isSunlight ? space.getSunlightAt(nvx, nvy, nvz) : space.getTorchLightAt(nvx, nvy, nvz, color);
      if ((isSunlight ? true : dynamicTorchLightLevel === 0) && !LightUtils.canEnterInto(nTransparency, ox, oy, oz)) {
        continue;
      }
      if (nl === 0) continue;
      if (nl < level || isSunlight && oy === -1 && level === maxLightLevel && nl === maxLightLevel) {
        queue.push({ voxel: [nvx, nvy, nvz], level: nl });
        if (isSunlight) {
          space.setSunlightAt(nvx, nvy, nvz, 0);
        } else {
          space.setTorchLightAt(nvx, nvy, nvz, 0, color);
        }
      } else if (isSunlight && oy === -1 ? nl > level : nl >= level) {
        if (isSunlight) {
          fill.push({ voxel: [nvx, nvy, nvz], level: nl });
          continue;
        }
        const emissionLevel = dynamicTorchLightLevel;
        if (typeof emissionLevel !== "number" || emissionLevel <= 0) {
          queue.push({ voxel: [nvx, nvy, nvz], level: nl });
          space.setTorchLightAt(nvx, nvy, nvz, 0, color);
          continue;
        }
        if (nl === emissionLevel) {
          fill.push({ voxel: [nvx, nvy, nvz], level: emissionLevel });
          continue;
        }
        queue.push({ voxel: [nvx, nvy, nvz], level: nl });
        space.setTorchLightAt(nvx, nvy, nvz, 0, color);
      }
    }
  }
  const liveFill = LightUtils.retainLiveFillNodes(
    fill,
    (vx, vy, vz) => isSunlight ? space.getSunlightAt(vx, vy, vz) : space.getTorchLightAt(vx, vy, vz, color)
  );
  return LightUtils.dedupeFillQueue(liveFill);
}
onmessage = function(e) {
  const { type } = e.data;
  if (type === "init") {
    registry = Registry.deserialize(e.data.registryData);
    return;
  }
  if (type === "batchOperations") {
    const {
      jobId,
      color,
      boundingBox,
      chunksData,
      chunkGridDimensions,
      chunkGridOffset,
      relevantDeltas,
      lightOps,
      options
    } = e.data;
    const [gridWidth, gridDepth] = chunkGridDimensions;
    const [gridOffsetX, gridOffsetZ] = chunkGridOffset;
    const chunkGrid = [];
    let idx = 0;
    for (let x = 0; x < gridWidth; x++) {
      chunkGrid[x] = [];
      for (let z = 0; z < gridDepth; z++) {
        const data = chunksData[idx++];
        chunkGrid[x][z] = data ? RawChunk.deserialize(data) : null;
      }
    }
    let lastSequenceId = 0;
    Object.entries(relevantDeltas).forEach(([chunkName, deltas]) => {
      const [cx, cz] = ChunkUtils.parseChunkName(chunkName);
      const localX = cx - gridOffsetX;
      const localZ = cz - gridOffsetZ;
      if (localX < 0 || localX >= gridWidth || localZ < 0 || localZ >= gridDepth) {
        return;
      }
      const chunk = chunkGrid[localX][localZ];
      if (!chunk) return;
      deltas.forEach((delta) => {
        const { coords, newVoxel, newRotation, newStage, sequenceId } = delta;
        chunk.setVoxel(coords[0], coords[1], coords[2], newVoxel);
        if (newRotation)
          chunk.setVoxelRotation(coords[0], coords[1], coords[2], newRotation);
        if (newStage !== void 0)
          chunk.setVoxelStage(coords[0], coords[1], coords[2], newStage);
        lastSequenceId = Math.max(lastSequenceId, sequenceId);
      });
    });
    const space = new BoundedSpace(
      chunkGrid,
      gridWidth,
      gridDepth,
      gridOffsetX,
      gridOffsetZ,
      options.chunkSize
    );
    const { min, shape } = boundingBox;
    const maxCoords = [
      min[0] + shape[0],
      min[1] + shape[1],
      min[2] + shape[2]
    ];
    if (lightOps.removals.length > 0) {
      const fillQueue = removeLightsBatch(
        space,
        lightOps.removals,
        color,
        min,
        maxCoords,
        options
      );
      if (fillQueue.length > 0) {
        for (const node of fillQueue) {
          const [vx, vy, vz] = node.voxel;
          if (color === "SUNLIGHT") {
            space.setSunlightAt(vx, vy, vz, node.level);
          } else {
            space.setTorchLightAt(vx, vy, vz, node.level, color);
          }
        }
        floodLight(space, fillQueue, color, min, maxCoords, options);
      }
    }
    if (lightOps.floods.length > 0) {
      lightOps.floods.forEach((node) => {
        const [vx, vy, vz] = node.voxel;
        if (color === "SUNLIGHT") {
          space.setSunlightAt(vx, vy, vz, node.level);
        } else {
          space.setTorchLightAt(vx, vy, vz, node.level, color);
        }
      });
      floodLight(space, lightOps.floods, color, min, maxCoords, options);
    }
    const modifiedChunks = space.getModifiedChunks();
    const transferBuffers = modifiedChunks.map((chunk) => chunk.chunk.lights.data.buffer).filter((buffer) => buffer instanceof ArrayBuffer);
    postMessage(
      {
        jobId,
        modifiedChunks: modifiedChunks.map((chunk) => ({
          coords: chunk.chunk.coords,
          lights: chunk.chunk.lights.data,
          minY: chunk.minY,
          maxY: chunk.maxY
        })),
        appliedDeltas: { lastSequenceId }
      },
      {
        transfer: transferBuffers
      }
    );
  }
};
