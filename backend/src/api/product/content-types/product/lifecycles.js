import { v4 as uuidv4 } from "uuid";

export default {
  beforeCreate(event) {
    const { data } = event.params;
    if (Array.isArray(data.variation)) {
      data.variation = data.variation.map((v) => ({
        ...v,
        uuid: v.uuid || uuidv4(),
      }));
    }
  },
  beforeUpdate(event) {
    const { data } = event.params;
    if (Array.isArray(data.variation)) {
      data.variation = data.variation.map((v) => ({
        ...v,
        uuid: v.uuid || uuidv4(),
      }));
    }
  },
};