/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { SavedObjectsClientContract } from 'src/core/server';
import { generateEnrollmentAPIKey, deleteEnrollmentApiKeyForConfigId } from './api_keys';
import { updateAgentsForConfigId, unenrollForConfigId } from './agents';

export async function agentConfigUpdateEventHandler(
  soClient: SavedObjectsClientContract,
  action: string,
  configId: string
) {
  if (action === 'created') {
    await generateEnrollmentAPIKey(soClient, {
      configId,
    });
  }

  if (action === 'updated') {
    await updateAgentsForConfigId(soClient, configId);
  }

  if (action === 'deleted') {
    await unenrollForConfigId(soClient, configId);
    await deleteEnrollmentApiKeyForConfigId(soClient, configId);
  }
}
