// import libs

// SECTION: Matrix data
// NOTE: 2d array
// [[1, 2], [3, 4]]
export type MoziMat = (number | string | undefined)[][];

// NOTE: Matrix data with labels
// {
//    label-1: 1;
//    label-2: 2;
//    label-3: 3;
//    label-4: 4;
// }
export type MoziMatObj = Record<string, number | string | undefined>;
