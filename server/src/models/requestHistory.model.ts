import mongoose, { Schema, Document } from "mongoose";

export interface IRequestHistory extends Document {
  method: string;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  createdAt: Date;
}

const requestHistorySchema = new Schema<IRequestHistory>(
  {
    method: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    status: {
      type: Number,
      required: true,
    },

    statusText: {
      type: String,
      required: true,
    },

    responseTime: {
      type: Number,
      required: true,
    },

    requestHeaders: {
      type: Schema.Types.Mixed,
      default: {},
    },

    requestBody: {
      type: Schema.Types.Mixed,
    },

    responseBody: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const RequestHistory = mongoose.model<IRequestHistory>(
  "RequestHistory",
  requestHistorySchema
);