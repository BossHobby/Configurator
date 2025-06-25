import semver from "semver";
import { BlackboxField } from "../constants";
import { transformBlackboxFieldFlags, type BlackboxFile } from "../blackbox";

const BLACKBOX_FRAME_TYPE_BIT = 0x80000000; // Bit 31

export class CompressedBlackboxDecoder {
  public readonly useCompression: boolean;
  private previousFrame: any[] | null = null;
  private fieldflags: number;
  private fieldOrder: BlackboxField[] = [];
  private fieldIndexMap: Map<BlackboxField, number> = new Map();

  constructor(firmwareVersion: string, file: BlackboxFile) {
    this.fieldflags = transformBlackboxFieldFlags(file.field_flags);
    this.useCompression = semver.gte(firmwareVersion, "0.2.5");

    // Build field order based on BlackboxField enum
    // Always include LOOP and TIME first
    if (this.fieldflags & (1 << BlackboxField.LOOP)) {
      this.fieldOrder.push(BlackboxField.LOOP);
      this.fieldIndexMap.set(BlackboxField.LOOP, this.fieldOrder.length - 1);
    }
    if (this.fieldflags & (1 << BlackboxField.TIME)) {
      this.fieldOrder.push(BlackboxField.TIME);
      this.fieldIndexMap.set(BlackboxField.TIME, this.fieldOrder.length - 1);
    }

    // Add other fields in enum order
    for (
      let field = BlackboxField.PID_P_TERM;
      field <= BlackboxField.DEBUG;
      field++
    ) {
      if (this.fieldflags & (1 << field)) {
        this.fieldOrder.push(field);
        this.fieldIndexMap.set(field, this.fieldOrder.length - 1);
      }
    }
  }

  public decode(data: any[]): any[] {
    if (!this.useCompression) {
      // Return data as-is for legacy format
      return data;
    }

    const decodedFrames: any[] = [];

    for (const frame of data) {
      const decodedFrame = this.decodeFrame(frame);
      if (decodedFrame) {
        decodedFrames.push(decodedFrame);
      }
    }

    return decodedFrames;
  }

  private isP_Frame(fieldFlags: number): boolean {
    return (fieldFlags & BLACKBOX_FRAME_TYPE_BIT) !== 0;
  }

  private getActiveFields(fieldFlags: number): number {
    return fieldFlags & ~BLACKBOX_FRAME_TYPE_BIT;
  }

  private decodeFrame(frameData: any): any[] | null {
    // The frame data from the flight controller is already CBOR decoded
    // It should have the structure: [field_flags, loop, time, ...fields]
    if (!Array.isArray(frameData) || frameData.length < 3) {
      console.warn("Invalid frame data:", frameData);
      return null;
    }

    let srcIndex = 0;
    const fieldFlags = frameData[srcIndex++];
    const loopValue = frameData[srcIndex++];
    const timeValue = frameData[srcIndex++];

    const isPFrame = this.isP_Frame(fieldFlags);
    const activeFields = this.getActiveFields(fieldFlags);

    // Initialize output frame with proper size
    const outputFrame: any[] = new Array(this.fieldOrder.length);

    if (isPFrame) {
      if (!this.previousFrame) {
        console.error("P-frame encountered without previous I-frame");
        return null;
      }
      // Start with a copy of the previous frame
      for (let i = 0; i < this.previousFrame.length; i++) {
        outputFrame[i] = this.previousFrame[i];
      }

      // In P-frames, loop and time are deltas
      const loopIndex = this.fieldIndexMap.get(BlackboxField.LOOP);
      const timeIndex = this.fieldIndexMap.get(BlackboxField.TIME);
      if (loopIndex !== undefined) {
        outputFrame[loopIndex] = this.previousFrame[loopIndex] + loopValue;
      }
      if (timeIndex !== undefined) {
        outputFrame[timeIndex] = this.previousFrame[timeIndex] + timeValue;
      }
    } else {
      // In I-frames, loop and time are full values
      // Initialize all fields to null first
      for (let i = 0; i < outputFrame.length; i++) {
        outputFrame[i] = null;
      }

      const loopIndex = this.fieldIndexMap.get(BlackboxField.LOOP);
      const timeIndex = this.fieldIndexMap.get(BlackboxField.TIME);
      if (loopIndex !== undefined) {
        outputFrame[loopIndex] = loopValue;
      }
      if (timeIndex !== undefined) {
        outputFrame[timeIndex] = timeValue;
      }
    }

    // Process remaining fields in the order they appear in the compressed data
    for (
      let field = BlackboxField.PID_P_TERM;
      field <= BlackboxField.DEBUG;
      field++
    ) {
      // Skip fields that are not enabled
      if (!(this.fieldflags & (1 << field))) {
        continue;
      }

      const fieldIndex = this.fieldIndexMap.get(field);
      if (fieldIndex === undefined) {
        continue;
      }

      if (activeFields & (1 << field)) {
        // Field is present in this frame
        const value = frameData[srcIndex];

        if (
          isPFrame &&
          this.previousFrame &&
          this.previousFrame[fieldIndex] !== null
        ) {
          // Apply delta to previous value
          outputFrame[fieldIndex] = this.addFieldValue(
            this.previousFrame[fieldIndex],
            value,
          );
        } else {
          // Use value directly (I-frame or first occurrence)
          outputFrame[fieldIndex] = value;
        }
        srcIndex++;
      }
      // If field not present in P-frame, it keeps value from previous frame (already copied)
    }

    // Store for next P-frame
    this.previousFrame = outputFrame;

    return outputFrame;
  }

  private addFieldValue(previous: any, delta: any): any {
    if (Array.isArray(previous) && Array.isArray(delta)) {
      // Handle arrays (vectors and debug data)
      const result: any[] = [];
      for (let i = 0; i < previous.length; i++) {
        result.push((previous[i] || 0) + (delta[i] || 0));
      }
      return result;
    } else if (typeof previous === "number" && typeof delta === "number") {
      // Handle scalar values
      return previous + delta;
    } else {
      // Fallback: just return the delta
      return delta;
    }
  }

  public reset() {
    // Reset state for new blackbox file
    this.previousFrame = null;
  }
}
