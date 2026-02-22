// import libs
import { Component } from "mozithermodb-settings";
// ! LOCALS
import { ComponentMoziData } from "@/docs/data";
import { ComponentMoziEquation } from "@/docs/equation";

// NOTE: Component Source
export type ComponentModelSource = {
    component: Component
    data: ComponentMoziData
    equations: Record<string, ComponentMoziEquation>
}