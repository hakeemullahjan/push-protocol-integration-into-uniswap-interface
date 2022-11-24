# push-protocol-integration-into-uniswap-interface
Get directly notified on Uniswap front-end when you interact with the dapp!  [https://uniswap-push.web.app/#/activity](https://uniswap-push.web.app/#/activity)

Channel [link](staging.push.org/#/channels?channel=0xEc025780fa9430Ce759bAB7E865Faf5Fa8b2C6E2) to opt-in to get notification or you can also subscribe to the channel on the frontend.

###### Activity tab:
Here you'll get all the notifications and history like SWAP, ADD LIQUIDITY or APPROVE etc. while you interact with frontend.

![Screenshot from 2022-11-24 18-13-27](https://user-images.githubusercontent.com/42214791/203793118-af9d6aa9-5e95-4aa1-8897-eeacf24c2a68.png)


###### List of activities
In this page you can gasless opt-in or opt-out to the channel.
Here you can see all your activities and these all notifications are clickable. When you click on it, it will take you to the etherscan explorer and verify your transactions.

![screencapture-uniswap-push-web-app-2022-11-24-18_38_20](https://user-images.githubusercontent.com/42214791/203798108-cbc75ea1-c73f-443e-b0b7-aef07b46b7d7.png)


### Technical part
When you look into the redux state of uniswap, they are storing every transaction and it's metadata like hash, isConfirmed, info and/or transactionType: SWAP, APPROVE, ADD_LIQUIDITY etc. Every block has is checked that tx is confirmed or not. While changing state from pending to confirmed of specific tx, that is good time to notify the user from front-end and also you can trigger you node server or subgraph whatever. 
I also triggering the user from the front-end and making payload of TX_TYPE. In the future you can make deatiled payload to the user, which will include complete information, how much TOKENS have been swapped - how much you've received. Which tokens you have given aproval, timestamp, all metadata.


![code](https://user-images.githubusercontent.com/42214791/203808232-c098db03-c64a-48a4-a0ec-91b5782c4422.png)


 [Send notification code link](https://github.com/hakeemullahjan/push-protocol-integration-into-uniswap-interface/blob/main/src/state/transactions/updater.tsx)

