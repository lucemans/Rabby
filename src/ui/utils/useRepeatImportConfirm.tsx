import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { isSameAddress, useWallet } from '@/ui/utils';
import AddressItem from '@/ui/component/AccountSearchInput/AddressItem';
import { useRabbyDispatch, useRabbySelector } from '@/ui/store';
import './confirmPopup.less';

export const useRepeatImportConfirm = () => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const [modal, contextHolder] = Modal.useModal();
  const history = useHistory();

  const { accountsList } = useRabbySelector((s) => ({
    ...s.accountToDisplay,
  }));
  const dispatch = useRabbyDispatch();

  useEffect(() => {
    dispatch.addressManagement.getHilightedAddressesAsync().then(() => {
      dispatch.accountToDisplay.getAllAccountsToDisplay();
    });
  }, []);
  const show = async ({ address, type }: { address: string; type: string }) => {
    const account = accountsList.find(
      (item) => isSameAddress(item.address, address) && item.type === type
    );

    if (account) {
      modal.confirm({
        title: t('page.newAddress.privateKey.repeatImportTips'),
        content: (
          <AddressItem
            address={address}
            type={account.type}
            brandName={account.type}
            balance={account.balance}
          />
        ),
        onOk: () => {
          wallet.changeAccount(account).then(() => {
            history.push('/dashboard');
          });
        },
        okText: t('global.confirm'),
        cancelText: t('global.Cancel'),
        width: 360,
        centered: true,
        className: 'confirm-modal',
      });
    }
  };
  return {
    show,
    contextHolder,
  };
};
