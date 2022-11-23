import * as PushAPI from '@pushprotocol/restapi'
import { chainNameType, NotificationItem } from '@pushprotocol/uiweb'
import { useWeb3React } from '@web3-react/core'
import { useCallback, useEffect, useState } from 'react'

const Activity = () => {
  const { account, chainId, provider } = useWeb3React()
  const [notifications, setNotification] = useState([])

  useEffect(() => {
    ;(async () => {
      if (account && chainId) {
        const feeds = await PushAPI.user.getFeeds({
          user: `eip155:${chainId}:${account}`,
          env: 'staging',
        })
        console.log({
          feeds,
        })
        setNotification(feeds)
      }
    })()
  }, [account, chainId])

  useEffect(() => {
    ;(async () => {
      if (account) {
        const subscriptions = await PushAPI.user.getSubscriptions({
          user: account,
          env: 'staging',
        })
        console.log({
          subscriptions,
        })
      }
    })()
  }, [account, chainId])

  const optInChannel = useCallback(async () => {
    if (account && provider !== undefined) {
      const _signer = provider?.getSigner(account)

      await PushAPI.channels.subscribe({
        signer: _signer as any,
        channelAddress: 'eip155:5:0xEc025780fa9430Ce759bAB7E865Faf5Fa8b2C6E2', // channel address in CAIP
        userAddress: `eip155:5:${account}`, // user address in CAIP
        onSuccess: () => {
          console.log('opt in success')
        },
        onError: () => {
          console.error('opt in error')
        },
        env: 'staging',
      })
    }
  }, [account, provider])

  const optOutChannel = useCallback(async () => {
    if (account && provider !== undefined) {
      const _signer = provider?.getSigner(account)

      await PushAPI.channels.subscribe({
        signer: _signer as any,
        channelAddress: 'eip155:5:0xEc025780fa9430Ce759bAB7E865Faf5Fa8b2C6E2', // channel address in CAIP
        userAddress: `eip155:5:${account}`, // user address in CAIP
        onSuccess: () => {
          console.log('opt in success')
        },
        onError: () => {
          console.error('opt in error')
        },
        env: 'staging',
      })
    }
  }, [account, provider])

  return (
    <div>
      <button onClick={optInChannel}>Opt In</button>
      <button onClick={optOutChannel}>Opt Out</button>

      {notifications.map((oneNotification, i) => {
        const { cta, title, message, app, icon, image, url, blockchain, secret, notification } = oneNotification
        return (
          <NotificationItem
            key={`notif-${i}`}
            notificationTitle={secret ? notification['title'] : title}
            notificationBody={secret ? notification['body'] : message}
            cta={cta}
            app={app}
            icon={icon}
            image={image}
            url={url}
            theme="light"
            chainName={blockchain as chainNameType}
          />
        )
      })}
    </div>
  )
}

export default Activity
