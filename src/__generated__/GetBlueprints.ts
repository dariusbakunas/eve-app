/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PageInput, BlueprintFilter, BlueprintsOrderByInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetBlueprints
// ====================================================

export interface GetBlueprints_blueprints_entries_item_invGroup {
  __typename: "InvGroup";
  id: string;
  name: string;
}

export interface GetBlueprints_blueprints_entries_item {
  __typename: "InvItem";
  id: string;
  name: string;
  invGroup: GetBlueprints_blueprints_entries_item_invGroup;
}

export interface GetBlueprints_blueprints_entries_character {
  __typename: "Character";
  name: string;
}

export interface GetBlueprints_blueprints_entries {
  __typename: "Blueprint";
  id: string;
  item: GetBlueprints_blueprints_entries_item;
  isCopy: boolean;
  materialEfficiency: number;
  timeEfficiency: number;
  maxRuns: number;
  character: GetBlueprints_blueprints_entries_character;
}

export interface GetBlueprints_blueprints {
  __typename: "BlueprintsResponse";
  total: number;
  entries: GetBlueprints_blueprints_entries[];
}

export interface GetBlueprints {
  blueprints: GetBlueprints_blueprints;
}

export interface GetBlueprintsVariables {
  page?: PageInput | null;
  filter?: BlueprintFilter | null;
  orderBy?: BlueprintsOrderByInput | null;
}