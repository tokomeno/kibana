/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ActionFactoryRegistry } from '../types';
import { ActionFactory, ActionFactoryDefinition } from '../dynamic_actions';
import { DrilldownDefinition, DrilldownActionFactoryContext } from '../drilldowns';

export interface UiActionsServiceEnhancementsParams {
  readonly actionFactories?: ActionFactoryRegistry;
}

export class UiActionsServiceEnhancements {
  protected readonly actionFactories: ActionFactoryRegistry;

  constructor({ actionFactories = new Map() }: UiActionsServiceEnhancementsParams = {}) {
    this.actionFactories = actionFactories;
  }

  /**
   * Register an action factory. Action factories are used to configure and
   * serialize/deserialize dynamic actions.
   */
  public readonly registerActionFactory = <
    Config extends object = object,
    FactoryContext extends object = object,
    ActionContext extends object = object
  >(
    definition: ActionFactoryDefinition<Config, FactoryContext, ActionContext>
  ) => {
    if (this.actionFactories.has(definition.id)) {
      throw new Error(`ActionFactory [actionFactory.id = ${definition.id}] already registered.`);
    }

    const actionFactory = new ActionFactory<Config, FactoryContext, ActionContext>(definition);

    this.actionFactories.set(actionFactory.id, actionFactory as ActionFactory<any, any, any>);
  };

  public readonly getActionFactory = (actionFactoryId: string): ActionFactory => {
    const actionFactory = this.actionFactories.get(actionFactoryId);

    if (!actionFactory) {
      throw new Error(`Action factory [actionFactoryId = ${actionFactoryId}] does not exist.`);
    }

    return actionFactory;
  };

  /**
   * Returns an array of all action factories.
   */
  public readonly getActionFactories = (): ActionFactory[] => {
    return [...this.actionFactories.values()];
  };

  /**
   * Convenience method to register a {@link DrilldownDefinition | drilldown}.
   */
  public readonly registerDrilldown = <
    Config extends object = object,
    PlaceContext extends object = object,
    ExecutionContext extends object = object
  >({
    id: factoryId,
    order,
    CollectConfig,
    createConfig,
    isConfigValid,
    getDisplayName,
    euiIcon,
    execute,
    getHref,
  }: DrilldownDefinition<Config, PlaceContext, ExecutionContext>): void => {
    const actionFactory: ActionFactoryDefinition<
      Config,
      DrilldownActionFactoryContext<PlaceContext>,
      ExecutionContext
    > = {
      id: factoryId,
      order,
      CollectConfig,
      createConfig,
      isConfigValid,
      getDisplayName,
      getIconType: () => euiIcon,
      isCompatible: async () => true,
      create: serializedAction => ({
        id: '',
        type: factoryId,
        getIconType: () => euiIcon,
        getDisplayName: () => serializedAction.name,
        execute: async context => await execute(serializedAction.config, context),
        getHref: getHref ? async context => getHref(serializedAction.config, context) : undefined,
      }),
    } as ActionFactoryDefinition<
      Config,
      DrilldownActionFactoryContext<PlaceContext>,
      ExecutionContext
    >;

    this.registerActionFactory(actionFactory);
  };
}
