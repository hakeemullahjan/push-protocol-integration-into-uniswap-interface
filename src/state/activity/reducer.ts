import { createSlice } from '@reduxjs/toolkit'
import { TransactionDetails } from 'state/transactions/types'

export interface ActivityState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

export const initialState: ActivityState = {}

const transactionSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    do() {
      //
    },
  },
})

export const {} = transactionSlice.actions
export default transactionSlice.reducer
