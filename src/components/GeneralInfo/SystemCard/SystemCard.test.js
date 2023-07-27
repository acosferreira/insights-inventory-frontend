/* eslint-disable camelcase */
import React from 'react';
import { mount, render } from 'enzyme';
import toJson from 'enzyme-to-json';
import SystemCard from './SystemCard';
import configureStore from 'redux-mock-store';
import { rhsmFacts, testProperties } from '../../../__mocks__/selectors';
import promiseMiddleware from 'redux-promise-middleware';

import { hosts } from '../../../api/api';
import MockAdapter from 'axios-mock-adapter';
import mockedData from '../../../__mocks__/mockedData.json';
import { Provider } from 'react-redux';

const mock = new MockAdapter(hosts.axios, { onNoMatch: 'throwException' });

const location = {};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => location,
  useHistory: () => ({
    push: () => undefined,
  }),
}));

jest.mock(
  '@redhat-cloud-services/frontend-components-utilities/RBACHook',
  () => ({
    esModule: true,
    usePermissionsWithContext: () => ({ hasAccess: true }),
  })
);

describe('SystemCard', () => {
  let initialState;
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore([promiseMiddleware]);
    mock
      .onGet('/api/inventory/v1/hosts/test-id/system_profile')
      .reply(200, mockedData);
    mock.onGet('/api/inventory/v1/hosts/test-id').reply(200, mockedData);
        mock.onGet('/api/inventory/v1/hosts/test-id/system_profile?fields%5Bsystem_profile%5D%5B%5D=operating_system').reply(200, mockedData); // eslint-disable-line

    location.pathname = 'localhost:3000/example/path';

    initialState = {
      entityDetails: {
        entity: {
          display_name: 'test-display-name',
          ansible_host: 'test-ansible-host',
          id: 'test-id',
          facts: {
            rhsm: rhsmFacts,
          },
        },
      },
      systemProfileStore: {
        systemProfile: {
          loaded: true,
          ...testProperties,
        },
      },
    };
  });

  it('should render correctly - no data', () => {
    const store = mockStore({ systemProfileStore: {}, entityDetails: {} });
    const wrapper = render(
      <Provider store={store}>
        <SystemCard />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with data', () => {
    const store = mockStore(initialState);
    const wrapper = render(
      <Provider store={store}>
        <SystemCard />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with SAP IDS', () => {
    const store = mockStore({
      ...initialState,
      systemProfileStore: {
        systemProfile: {
          loaded: true,
          ...testProperties,
          sap_sids: ['AAA', 'BBB'],
        },
      },
    });
    const wrapper = render(
      <Provider store={store}>
        <SystemCard />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  it('should render correctly with rhsm facts', () => {
    const store = mockStore({
      ...initialState,
      systemProfileStore: {
        systemProfile: {
          loaded: true,
        },
      },
    });
    const wrapper = render(
      <Provider store={store}>
        <SystemCard />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });

  describe('API', () => {
    it('should calculate correct ansible host - direct ansible host', () => {
      const store = mockStore(initialState);
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      expect(
        wrapper.find('SystemCardCore').first().instance().getAnsibleHost()
      ).toBe('test-ansible-host');
    });

    it('should calculate correct ansible host - fqdn', () => {
      const store = mockStore({
        ...initialState,
        entityDetails: {
          entity: {
            ...initialState.entity,
            ansible_host: undefined,
            fqdn: 'test-fqdn',
          },
        },
      });
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      expect(
        wrapper.find('SystemCardCore').first().instance().getAnsibleHost()
      ).toBe('test-fqdn');
    });

    it('should calculate correct ansible host - fqdn', () => {
      const store = mockStore({
        ...initialState,
        entityDetails: {
          entity: {
            ...initialState.entity,
            ansible_host: undefined,
            id: 'test-id',
          },
        },
      });
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      expect(
        wrapper.find('SystemCardCore').first().instance().getAnsibleHost()
      ).toBe('test-id');
    });

    it('should show edit display name', () => {
      const store = mockStore(initialState);
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      wrapper
        .find('a[href$="display_name"]')
        .first()
        .simulate('click', {
          preventDefault: () => undefined,
        });
      expect(
        wrapper
          .find('TextInputModal[title="Edit display name"]')
          .first()
          .instance().props.isOpen
      ).toBe(true);
      expect(
        wrapper
          .find('TextInputModal[title="Edit Ansible host"]')
          .first()
          .instance().props.isOpen
      ).toBe(false);
    });

    it('should show edit display name', () => {
      const store = mockStore(initialState);
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      wrapper
        .find('a[href$="ansible_name"]')
        .first()
        .simulate('click', {
          preventDefault: () => undefined,
        });
      expect(
        wrapper
          .find('TextInputModal[title="Edit display name"]')
          .first()
          .instance().props.isOpen
      ).toBe(false);
      expect(
        wrapper
          .find('TextInputModal[title="Edit Ansible host"]')
          .first()
          .instance().props.isOpen
      ).toBe(true);
    });

    it('should call edit display name actions', () => {
      mock.onPatch('/api/inventory/v1/hosts/test-id').reply(200, mockedData);
      mock
        .onGet('/api/inventory/v1/hosts/test-id/system_profile')
        .reply(200, mockedData);
      const store = mockStore(initialState);
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      wrapper
        .find('a[href$="display_name"]')
        .first()
        .simulate('click', {
          preventDefault: () => undefined,
        });
      wrapper.find('button[data-action="confirm"]').first().simulate('click');
      expect(store.getActions().length).toBe(0); // the button is disabled since the input hasn't been changed
    });

    it('should call edit display name actions', () => {
      mock.onPatch('/api/inventory/v1/hosts/test-id').reply(200, mockedData);
      mock
        .onGet('/api/inventory/v1/hosts/test-id/system_profile')
        .reply(200, mockedData);
      const store = mockStore(initialState);
      const wrapper = mount(
        <Provider store={store}>
          <SystemCard />
        </Provider>
      );
      wrapper
        .find('a[href$="ansible_name"]')
        .first()
        .simulate('click', {
          preventDefault: () => undefined,
        });
      wrapper.find('button[data-action="confirm"]').first().simulate('click');
      expect(store.getActions().length).toBe(0); // the button is disabled since the input hasn't been changed
    });

    it('should handle click on SAP identifiers', () => {
      const store = mockStore({
        ...initialState,
        systemProfileStore: {
          systemProfile: {
            loaded: true,
            ...testProperties,
            sap_sids: ['AAA', 'BBB'],
          },
        },
      });
      const handleClick = jest.fn();
      location.pathname = 'localhost:3000/example/sap_sids';

      const wrapper = mount(
        <Provider store={store}>
          <SystemCard handleClick={handleClick} />
        </Provider>
      );
      wrapper.find('dd a').last().simulate('click');
      expect(handleClick).toHaveBeenCalledWith('SAP IDs (SID)', {
        cells: [
          {
            title: 'SID',
            transforms: expect.any(Array),
          },
        ],
        filters: [{ type: 'textual' }],
        rows: [['AAA'], ['BBB']],
      });
    });

    it('should handle click on cpu flags identifiers', () => {
      const store = mockStore({
        ...initialState,
        systemProfileStore: {
          systemProfile: {
            loaded: true,
            ...testProperties,
            cpu_flags: ['flag_1', 'flag_2'],
          },
        },
      });
      const handleClick = jest.fn();
      location.pathname = 'localhost:3000/example/flag';

      const wrapper = mount(
        <Provider store={store}>
          <SystemCard handleClick={handleClick} />
        </Provider>
      );
      wrapper.find('dd a').last().simulate('click');
      expect(handleClick).toHaveBeenCalledWith('CPU flags', {
        cells: [
          {
            title: 'flag name',
            transforms: expect.any(Array),
          },
        ],
        filters: [{ type: 'textual' }],
        rows: [['flag_1'], ['flag_2']],
      });
    });
  });

  [
    'hasHostName',
    'hasDisplayName',
    'hasAnsibleHostname',
    'hasSAP',
    'hasSystemPurpose',
    'hasCPUs',
    'hasSockets',
    'hasCores',
    'hasCPUFlags',
    'hasRAM',
  ].map((item) =>
    it(`should not render ${item}`, () => {
      const store = mockStore(initialState);
      const wrapper = render(
        <Provider store={store}>
          <SystemCard {...{ [item]: false }} />
        </Provider>
      );
      expect(toJson(wrapper)).toMatchSnapshot();
    })
  );

  it('should render extra', () => {
    const store = mockStore(initialState);
    const wrapper = render(
      <Provider store={store}>
        <SystemCard
          extra={[
            { title: 'something', value: 'test' },
            {
              title: 'with click',
              value: '1 tests',
              onClick: (_e, handleClick) =>
                handleClick('Something', {}, 'small'),
            },
          ]}
        />
      </Provider>
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
