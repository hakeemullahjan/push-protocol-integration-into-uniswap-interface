import { Wallet } from '@ethersproject/wallet'
import * as PushAPI from '@pushprotocol/restapi'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { EventName } from '@uniswap/analytics-events'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import LibUpdater from 'lib/hooks/transactions/updater'
import { formatPercentInBasisPointsNumber, formatToDecimal, getTokenAddress } from 'lib/utils/analytics'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { TransactionDetails, TransactionInfo, TransactionType } from 'state/transactions/types'
import { computeRealizedPriceImpact } from 'utils/prices'

import { L2_CHAIN_IDS } from '../../constants/chains'
import { useDerivedSwapInfo } from '../../state/swap/hooks'
import { useAddPopup } from '../application/hooks'
import { checkedTransaction, finalizeTransaction } from './reducer'
import { SerializableTransactionReceipt } from './types'

interface AnalyticsEventProps {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  succeeded: boolean
}

const formatAnalyticsEventProperties = ({ trade, hash, allowedSlippage, succeeded }: AnalyticsEventProps) => ({
  estimated_network_fee_usd: trade.gasUseEstimateUSD ? formatToDecimal(trade.gasUseEstimateUSD, 2) : undefined,
  transaction_hash: hash,
  token_in_address: getTokenAddress(trade.inputAmount.currency),
  token_out_address: getTokenAddress(trade.outputAmount.currency),
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
  token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
  price_impact_basis_points: formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)),
  allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  swap_quote_block_number: trade.blockNumber,
  succeeded,
})

export default function Updater() {
  const { chainId, account } = useWeb3React()
  const addPopup = useAddPopup()
  // speed up popup dismisall time if on L2
  const isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))
  const transactions = useAppSelector((state) => state.transactions)
  const {
    trade: { trade },
    allowedSlippage,
  } = useDerivedSwapInfo()

  const dispatch = useAppDispatch()
  const onCheck = useCallback(
    ({ chainId, hash, blockNumber }: { chainId: number; hash: string; blockNumber: number }) =>
      dispatch(checkedTransaction({ chainId, hash, blockNumber })),
    [dispatch]
  )

  const sendNotification = useCallback(
    async (hash: string, chainId: number) => {
      try {
        const PK = '52461b779055884559996516caf60bc72daebfc6b23a79d42cb85ff932086882' // channel private key
        const Pkey = `0x${PK}`
        const signer = new Wallet(Pkey)

        const tx: TransactionDetails = transactions[chainId][hash]
        const txInfo: TransactionInfo = tx.info

        const apiResponse = await PushAPI.payloads.sendNotification({
          signer,
          type: 3, // target
          identityType: 2, // direct payload
          notification: {
            title: `${TransactionType[txInfo.type]}`,
            body: `Uniswap ${TransactionType[txInfo.type]} transaction!`,
          },
          payload: {
            title: `${TransactionType[txInfo.type]}`,
            body: `Uniswap ${TransactionType[txInfo.type]} transaction!`,
            cta: `https://goerli.etherscan.io/tx/${hash}`,
            img: '',
          },
          recipients: `eip155:5:${account}`, // recipient address
          channel: 'eip155:5:0xEc025780fa9430Ce759bAB7E865Faf5Fa8b2C6E2', // your channel address
          env: 'staging',
        })

        // apiResponse?.status === 204, if sent successfully!
        console.log('API repsonse: ', apiResponse)
      } catch (err) {
        console.error('Error: ', err)
      }
    },
    [account, transactions]
  )

  const onReceipt = useCallback(
    async ({ chainId, hash, receipt }: { chainId: number; hash: string; receipt: SerializableTransactionReceipt }) => {
      dispatch(
        finalizeTransaction({
          chainId,
          hash,
          receipt: {
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber,
            contractAddress: receipt.contractAddress,
            from: receipt.from,
            status: receipt.status,
            to: receipt.to,
            transactionHash: receipt.transactionHash,
            transactionIndex: receipt.transactionIndex,
          },
        })
      )

      const tx = transactions[chainId]?.[hash]

      if (tx.info.type === TransactionType.SWAP && trade) {
        sendAnalyticsEvent(
          EventName.SWAP_TRANSACTION_COMPLETED,
          formatAnalyticsEventProperties({
            trade,
            hash,
            allowedSlippage,
            succeeded: receipt.status === 1,
          })
        )
      }
      addPopup(
        {
          txn: { hash },
        },
        hash,
        isL2 ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      )

      await sendNotification(hash, chainId)
    },
    [addPopup, allowedSlippage, dispatch, isL2, trade, transactions, chainId] //account, provider
  )

  const pendingTransactions = useMemo(() => (chainId ? transactions[chainId] ?? {} : {}), [chainId, transactions])

  return <LibUpdater pendingTransactions={pendingTransactions} onCheck={onCheck} onReceipt={onReceipt} />
}
