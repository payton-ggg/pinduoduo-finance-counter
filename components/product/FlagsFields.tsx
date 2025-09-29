"use client";

import { UseFormRegister } from "react-hook-form";

type FlagsFieldsProps = {
  register: UseFormRegister<any>;
};

export function FlagsFields({ register }: FlagsFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("workModalWindowIOS")} />
        <span>Work Modal Window iOS</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("soundReducer")} />
        <span>Sound Reducer</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("sensesOfEar")} />
        <span>Senses of Ear</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("wirelessCharger")} />
        <span>Wireless Charger</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("gyroscope")} />
        <span>Gyroscope</span>
      </label>
    </div>
  );
}