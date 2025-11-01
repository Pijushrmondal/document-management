import { Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const toObjectId = (id: string): ObjectId => {
  return new Types.ObjectId(id);
};

export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};
