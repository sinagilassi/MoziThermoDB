// import libs
import { ThermoRecord } from '@/types';


export class MoziData {
    constructor(
        public name: string,
        public description: string,
        public data: ThermoRecord[]
    ) { }
}