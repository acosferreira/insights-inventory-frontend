import React, { useState, useEffect, useContext, Suspense } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    Bullseye,
    Spinner
} from '@patternfly/react-core';
import {
    Skeleton,
    SkeletonSize
} from '@redhat-cloud-services/frontend-components/Skeleton';
import { PageHeader } from '@redhat-cloud-services/frontend-components/PageHeader';
import {
    InventoryDetailHead,
    DetailWrapper
} from '@redhat-cloud-services/frontend-components/Inventory';
import { useHistory, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { deviceDetail } from '../store/edgeDetails';
import RegistryContext from '../store/registeryContext';
import EdgeDetailTabs from '../components/EdgeDetail/EdgeDetailTabs';
import { getDevice, getInventory } from '../api/api';
import Status, { getDeviceStatus } from '../components/EdgeDetail/Status';
import useApi from '../Utilities/hooks/useApi';
import RetryUpdatePopover from '../components/EdgeDetail/RetryUpdatePopover';
import { useLoadModule } from '@scalprum/react-core';
import { routes as paths } from '../Routes';
import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';

const DeviceDetail = () => {
    const [{ default: systemProfileStore }] = useLoadModule(
        {
            appName: 'inventory',
            scope: 'inventory',
            module: './systemProfileStore'
        },
        {}
    );
    const history = useHistory();
    const { inventoryId, groupId } = useParams();
    const [imageId, setImageId] = useState(null);
    const { getRegistry } = useContext(RegistryContext);
    const hasEntityFinishedLoading = useSelector(
        (store) => store?.entityDetails?.loaded
    );
    const entity = useSelector(({ entityDetails }) => entityDetails?.entity);

    const [imageData, setImageData] = useState();
    const [updateModal, setUpdateModal] = useState({
        isOpen: false,
        deviceData: null
    });
    const [isDeviceStatusLoading, setIsDeviceStatusLoading] = useState(true);
    const [reload, setReload] = useState(false);

    const [deviceData, fetchDeviceData] = useApi({
        api: () =>
            getInventory({
                query: {
                    uuid: inventoryId
                }
            })
    });

    const [deviceView] = deviceData.data?.data?.devices || [];
    const {
        Status: deviceViewStatus,
        UpdateAvailable: updateAvailable,
        DispatcherStatus: updateStatus,
        LastSeen: lastSeen,
        DeviceGroups: deviceGroups
    } = deviceView || {};

    const groupName = groupId
        ? deviceGroups?.find((group) => group.ID.toString() === groupId)?.Name
        : null;

    const deviceStatus = getDeviceStatus(
        deviceViewStatus,
        updateAvailable,
        updateStatus
    );

    useEffect(() => {
        insights.chrome.registerModule('inventory');
        insights.chrome?.hideGlobalFilter?.(true);
        insights.chrome.appAction('system-detail');
    }, []);

    useEffect(() => {
        (async () => {
            if (!entity?.display_name) {
                return;
            }

            const imageData = await getDevice(inventoryId);
            setImageData(imageData);
            setIsDeviceStatusLoading(false);
            setUpdateModal((prevState) => ({
                ...prevState,
                deviceData: [
                    {
                        // eslint-disable-next-line camelcase
                        display_name: entity.display_name,
                        id: entity.id,
                        deviceStatus
                    }
                ],
                imageSetId: imageData?.ImageInfo?.Image?.ImageSetID
            }));
            setImageId(imageData?.ImageInfo?.Image?.ID);
        })();
    }, [entity, reload]);

    return systemProfileStore ? (
        <DetailWrapper
            hideInvLink
            showTags
            appName="general_information"
            onLoad={({ mergeWithDetail }) => {
                getRegistry().register({
                    systemProfileStore,
                    ...mergeWithDetail(deviceDetail)
                });
            }}
            inventoryId={inventoryId}
        >
            <PageHeader>
                {!groupName ? (
                    <Breadcrumb ouiaId="systems-list">
                        <BreadcrumbItem>
                            <Link to={paths.table}>Systems</Link>
                        </BreadcrumbItem>
                        <BreadcrumbItem isActive>
                            <div className="ins-c-inventory__detail--breadcrumb-name">
                                {entity?.display_name || <Skeleton size={SkeletonSize.xs} />}
                            </div>
                        </BreadcrumbItem>
                    </Breadcrumb>
                ) : (
                    <></>
                    // <Breadcrumb ouiaId="groups-list">
                    //     <BreadcrumbItem>
                    //         <Link to={paths.fleetManagement}>Groups</Link>
                    //     </BreadcrumbItem>
                    //     <BreadcrumbItem>
                    //         <Link to={`${paths.fleetManagement}/${groupId}`}>
                    //             {groupName}
                    //         </Link>
                    //     </BreadcrumbItem>
                    //     <BreadcrumbItem isActive>
                    //         <div className="ins-c-inventory__detail--breadcrumb-name">
                    //             {entity?.display_name || <Skeleton size={SkeletonSize.xs} />}
                    //         </div>
                    //     </BreadcrumbItem>
                    // </Breadcrumb>
                )}
                <InventoryDetailHead
                    fallback=""
                    actions={[
                        {
                            title: 'Update',
                            isDisabled:
                                imageData?.UpdateTransactions?.[0]?.Status === 'BUILDING' ||
                                imageData?.UpdateTransactions?.[0]?.Status === 'CREATED' ||
                                !imageData?.ImageInfo?.UpdatesAvailable?.length > 0,
                            onClick: () => {
                                history.push({
                                    pathname: `/${inventoryId}/update`,
                                    search: '?from_details=true'
                                });
                            }
                        }
                    ]}
                    hideBack
                    hideInvDrawer
                    inventoryId={inventoryId}
                />

                {isDeviceStatusLoading ? (
                    <Skeleton size={SkeletonSize.xs} />
                ) : deviceStatus === 'error' || deviceStatus === 'unresponsive' ? (
                    <RetryUpdatePopover
                        lastSeen={lastSeen}
                        device={deviceView}
                        position={'right'}
                        fetchDevices={fetchDeviceData}
                    >
                        <Status
                            id={'device-status'}
                            type={
                                deviceStatus === 'error'
                                    ? 'errorWithExclamationCircle'
                                    : deviceStatus
                            }
                            isLink={true}
                            isLabel={true}
                            className="pf-u-mt-sm cursor-pointer"
                        />
                    </RetryUpdatePopover>
                ) : (
                    <Status
                        id={'device-status'}
                        type={deviceStatus}
                        isLabel={true}
                        className="pf-u-mt-sm"
                    />
                )}
            </PageHeader>
            {hasEntityFinishedLoading && (
                <EdgeDetailTabs
                    systemProfile={imageData}
                    imageId={imageId}
                    setUpdateModal={setUpdateModal}
                    setReload={setReload}
                    inventoryId={inventoryId}
                />
            )}
            {updateModal.isOpen && (
                <Suspense
                    fallback={
                        <Bullseye>
                            <Spinner />
                        </Bullseye>
                    }
                >
                    <AsyncComponent
                        appName="edge"
                        module="./UpdateDeviceModal"
                        setUpdateModal={setUpdateModal}
                        updateModal={updateModal}
                        refreshTable={() => setReload(true)}
                    />
                </Suspense>
            )}
        </DetailWrapper>
    ) : (
        <Bullseye>
            <Spinner />
        </Bullseye>
    );
};

export default DeviceDetail;
