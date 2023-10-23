import {
  Bullseye,
  PageSection,
  Spinner,
  Tab,
  Tabs,
} from '@patternfly/react-core';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import PropTypes from 'prop-types';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroupDetail } from '../../store/inventory-actions';
import GroupSystems from '../GroupSystems';
import GroupTabDetails from './GroupTabDetails';
import GroupDetailHeader from './GroupDetailHeader';
import { usePermissionsWithContext } from '@redhat-cloud-services/frontend-components-utilities/RBACHook';
import {
  REQUIRED_PERMISSIONS_TO_READ_GROUP,
  REQUIRED_PERMISSIONS_TO_READ_GROUP_HOSTS,
} from '../../constants';
import {
  EmptyStateNoAccessToGroup,
  EmptyStateNoAccessToSystems,
} from './EmptyStateNoAccess';

// import { useLocation, useNavigate } from 'react-router-dom';
// import { resolveRelPath } from '../../Utilities/path';
// import {
//   getNotificationProp,
//   manageEdgeInventoryUrlName,
// } from '../../Utilities/edge';
// import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';
// import ErrorState from '@redhat-cloud-services/frontend-components/ErrorState';

import useFeatureFlag from '../../Utilities/useFeatureFlag';
import axios from 'axios';
import {
  INVENTORY_TOTAL_FETCH_CONVENTIONAL_PARAMS,
  INVENTORY_TOTAL_FETCH_EDGE_PARAMS,
  INVENTORY_TOTAL_FETCH_URL_SERVER,
  hybridInventoryTabKeys,
} from '../../Utilities/constants';

const SuspenseWrapper = ({ children }) => (
  <Suspense
    fallback={
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    }
  >
    {children}
  </Suspense>
);

const GroupDetailInfo = lazy(() => import('./GroupDetailInfo'));
const InventoryGroupDetail = ({ groupId }) => {
  const [activeTabKey, setActiveTabKey] = useState(0);

  // const handleTabClick = (_event, tabIndex) => {
  //   setActiveTabKey(tabIndex);
  // };

  const [activeTab, setActiveTab] = useState(0);

  const dispatch = useDispatch();
  // const notificationProp = getNotificationProp(dispatch);
  const { data } = useSelector((state) => state.groupDetail);
  const chrome = useChrome();
  const groupName = data?.results?.[0]?.name;

  const { hasAccess: canViewGroup } = usePermissionsWithContext(
    REQUIRED_PERMISSIONS_TO_READ_GROUP(groupId)
  );
  const { hasAccess: canViewHosts } = usePermissionsWithContext(
    REQUIRED_PERMISSIONS_TO_READ_GROUP_HOSTS(groupId)
  );

  useEffect(() => {
    if (canViewGroup === true) {
      dispatch(fetchGroupDetail(groupId));
    }
  }, [canViewGroup]);

  useEffect(() => {
    // if available, change ID to the group's name in the window title
    chrome?.updateDocumentTitle?.(
      `${groupName || groupId} - Inventory Groups | Red Hat Insights`
    );
  }, [data]);

  // TODO: append search parameter to identify the active tab

  const [hasEdgeImages, setHasEdgeImages] = useState(false);
  const EdgeParityEnabled = useFeatureFlag('edgeParity.inventory-list');
  useEffect(() => {
    if (EdgeParityEnabled) {
      try {
        axios
          .get(
            `${INVENTORY_TOTAL_FETCH_URL_SERVER}${INVENTORY_TOTAL_FETCH_EDGE_PARAMS}&group_name=${groupName}`
          )
          .then((result) => {
            const accountHasEdgeImages = result?.data?.total > 0;
            setHasEdgeImages(accountHasEdgeImages);
            axios
              .get(
                `${INVENTORY_TOTAL_FETCH_URL_SERVER}${INVENTORY_TOTAL_FETCH_CONVENTIONAL_PARAMS}&group_name=${groupName}`
              )
              .then((conventionalImages) => {
                const accountHasConventionalImages =
                  conventionalImages?.data?.total > 0;
                if (accountHasEdgeImages && !accountHasConventionalImages) {
                  setActiveTab(hybridInventoryTabKeys.immutable.key);
                } else {
                  setActiveTab(hybridInventoryTabKeys.conventional.key);
                }
              });
          });
      } catch (e) {
        console.log('>>>> ' + e);
      }
    }
  }, [data]);
  console.log('>>>>hasEdgeImages: ' + hasEdgeImages);
  return hasEdgeImages && canViewGroup ? (
    <React.Fragment>
      <GroupDetailHeader groupId={groupId} />
      {canViewGroup ? (
        <PageSection variant="light" type="tabs">
          <GroupTabDetails
            groupId={groupId}
            groupName={groupName}
            activeTab={activeTab}
          />
        </PageSection>
      ) : (
        <PageSection>
          <EmptyStateNoAccessToGroup />
        </PageSection>
      )}
    </React.Fragment>
  ) : (
    <React.Fragment>
      <GroupDetailHeader groupId={groupId} />
      <PageSection variant="light" type="tabs">
        <Tabs
          activeKey={activeTabKey}
          onSelect={(event, value) => setActiveTabKey(value)}
          aria-label="Group tabs"
          role="region"
          inset={{ default: 'insetMd' }} // add extra space before the first tab (according to mocks)
        >
          <Tab eventKey={0} title="Systems" aria-label="Group systems tab">
            <PageSection>
              {canViewHosts ? (
                <GroupSystems groupName={groupName} groupId={groupId} />
              ) : (
                <EmptyStateNoAccessToSystems />
              )}
            </PageSection>
          </Tab>
          <Tab eventKey={1} title="Group info" aria-label="Group info tab">
            {activeTabKey === 1 && ( // helps to lazy load the component
              <PageSection>
                <Suspense
                  fallback={
                    <Bullseye>
                      <Spinner />
                    </Bullseye>
                  }
                >
                  <GroupDetailInfo />
                </Suspense>
              </PageSection>
            )}
          </Tab>
        </Tabs>
      </PageSection>
    </React.Fragment>
  );

  // <GroupSystems groupName={groupName} groupId={groupId} />
};

InventoryGroupDetail.propTypes = {
  groupId: PropTypes.string.isRequired,
  groupName: PropTypes.string,
};

SuspenseWrapper.propTypes = {
  children: PropTypes.element,
};
export default InventoryGroupDetail;
