import GeneralInformationTab from '../components/EdgeDetail/index.js';
import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

const entityLoaded = (state) => {
    return {
        ...state,
        loaded: true,
        activeApps: [
            {
                title: 'General information',
                name: 'general_information',
                component: GeneralInformationTab
            }
        ]
    };
};

export const deviceDetail = applyReducerHash({
    LOAD_ENTITY_FULFILLED: entityLoaded
});
