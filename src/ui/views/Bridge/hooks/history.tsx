import { useInViewport, useInfiniteScroll } from 'ahooks';
import React, { useEffect, useRef, useState } from 'react';
import { useRabbySelector } from '@/ui/store';
import { useAsync } from 'react-use';
import { uniqBy } from 'lodash';
import { useWallet } from '@/ui/utils';

export const useBridgeHistory = () => {
  const addr = useRabbySelector(
    (state) => state.account.currentAccount?.address || ''
  );

  const [refreshTxListCount, setRefreshListTx] = useState(0);
  const refreshBridgeListTx = React.useCallback(() => {
    setRefreshListTx((e) => e + 1);
  }, []);
  const isInBridge = true;

  const wallet = useWallet();
  const getBridgeHistoryList = React.useCallback(
    async (addr: string, start = 0, limit = 5) => {
      const data = await wallet.openapi.getBridgeHistoryList({
        user_addr: addr,
        start: start,
        limit: limit,
      });
      return {
        list: data?.history_list,
        last: data,
        totalCount: data?.total_cnt,
      };
    },
    [wallet?.openapi?.getSwapTradeList]
  );

  const {
    data: txList,
    loading,
    loadMore,
    loadingMore,
    noMore,
    mutate,
  } = useInfiniteScroll(
    (d) =>
      getBridgeHistoryList(
        addr,
        d?.list?.length && d?.list?.length > 1 ? d?.list?.length : 0,
        5
      ),
    {
      reloadDeps: [isInBridge],
      isNoMore(data) {
        if (data) {
          return data?.list.length >= data?.totalCount;
        }
        return true;
      },
      manual: !isInBridge || !addr,
    }
  );

  const { value } = useAsync(async () => {
    if (addr) {
      return getBridgeHistoryList(addr, 0, 5);
    }
  }, [addr, refreshTxListCount]);

  useEffect(() => {
    if (value?.list) {
      mutate((d) => {
        if (!d) {
          return;
        }
        return {
          last: d?.last,
          totalCount: d?.totalCount,
          list: uniqBy(
            [...(value.list || []), ...(d?.list || [])],
            (e) => `${e.chain}-${e.detail_url}`
          ),
        };
      });
    }
  }, [mutate, value]);

  const ref = useRef<HTMLDivElement>(null);

  const [inViewport] = useInViewport(ref);

  useEffect(() => {
    if (!noMore && inViewport && !loadingMore && loadMore && isInBridge) {
      loadMore();
    }
  }, [inViewport, loadMore, loading, loadingMore, noMore, isInBridge]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      !loading &&
      !loadingMore &&
      txList?.list?.some((e) => e.status !== 'completed') &&
      isInBridge
    ) {
      timer = setTimeout(refreshBridgeListTx, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, loadingMore, refreshBridgeListTx, txList?.list, isInBridge]);

  return {
    loading,
    txList,
    loadingMore,
    ref,
  };
};
