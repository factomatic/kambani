import { ActionType } from './action-type';
import { CreateRoutes } from './create-routes';
import { SharedRoutes } from './shared-routes';

const actionRoutes = {
  [ActionType.CreateAdvanced]: [
    SharedRoutes.Action,
    CreateRoutes.ManagementKeys,
    CreateRoutes.DidKeys,
    CreateRoutes.Services,
    CreateRoutes.Summary
  ],
  [ActionType.CreateBasic]: [
    SharedRoutes.Action,
    CreateRoutes.Summary
  ]
};

export {
  actionRoutes
};
