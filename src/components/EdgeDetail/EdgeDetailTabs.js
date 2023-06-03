import React, { useState } from 'react';
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import GeneralInformationTab from '../../components/EdgeDetail/index.js';
import VulnerabilityTab from './Vulnerability';
import PropTypes from 'prop-types';

const EdgeDetailTabs = ({
    systemProfile,
    imageId,
    setUpdateModal,
    setReload,
    inventoryId
}) => {
    const [activeTabKey, setActiveTabkey] = useState(0);
    const handleTabClick = (_event, tabIndex) => setActiveTabkey(tabIndex);

    return (
        <Tabs
            className="pf-u-ml-md"
            activeKey={activeTabKey}
            onSelect={handleTabClick}
        >
            <Tab eventKey={0} title={<TabTitleText>Details</TabTitleText>}>
                <section className="pf-l-page__main-section pf-c-page__main-section">
                    <GeneralInformationTab inventoryId={inventoryId} />
                </section>
            </Tab>
            <Tab eventKey={1} title={<TabTitleText>Vulnerability</TabTitleText>}>
                <VulnerabilityTab
                    deviceData={systemProfile}
                    setUpdateModal={setUpdateModal}
                    imageId={imageId}
                    setReload={setReload}
                    inventoryId={inventoryId}
                />
            </Tab>
        </Tabs>
    );
};

EdgeDetailTabs.propTypes = {
    imageId: PropTypes.number,
    systemProfile: PropTypes.object,
    setUpdateModal: PropTypes.func,
    setReload: PropTypes.func,
    inventoryId: PropTypes.string
};

export default EdgeDetailTabs;
