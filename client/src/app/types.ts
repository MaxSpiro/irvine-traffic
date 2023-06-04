export type Trip = {
  median: string;
  time: string;
};

export type Res = {
  sd: {
    data: Trip[];
  };
  ir: {
    data: Trip[];
  };
};

export type ChartValue = Record<keyof Trip, number>;

export type Chart = {
  sd: ChartValue[];
  ir: ChartValue[];
};
