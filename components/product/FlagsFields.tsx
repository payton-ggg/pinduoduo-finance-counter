"use client";

import { UseFormRegister } from "react-hook-form";

type FlagsFieldsProps = {
  register: UseFormRegister<any>;
};

export function FlagsFields({ register }: FlagsFieldsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("workModalWindowIOS")} />
        <span>Модальное окно iOS</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("soundReducer")} />
        <span>Шумоподавление</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("sensesOfEar")} />
        <span>Датчик уха</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("wirelessCharger")} />
        <span>Беспроводная зарядка</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" {...register("gyroscope")} />
        <span>Гироскоп</span>
      </label>
    </div>
  );
}