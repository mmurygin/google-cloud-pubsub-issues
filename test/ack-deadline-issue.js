'use strict';

const uuid = require('uuid').v4;
const Pubsub = require('@google-cloud/pubsub');
const assert = require('assert');

const pubsub = Pubsub();
const client = new Pubsub.v1.SubscriberClient();
const projId = process.env.GCLOUD_PROJECT;

function getRandomName() {
    return `test-pubsub-issue-${uuid()}`;
}

describe('broken ack deadline', function() {
    const ackDeadlineSeconds = 120;

    let topic;
    let subscription;
    let subscriptionName;
    beforeEach(() => {
        topic = pubsub.topic(getRandomName());
        subscriptionName = getRandomName();
        subscription = topic.subscription(subscriptionName);

        return topic
            .create()
            .then(() => {
                const createSubscriptionRequest = {
                    topic: topic.name,
                    name: client.subscriptionPath(projId, subscriptionName),
                    ackDeadlineSeconds,
                };

                // we use Pubsub.v1.Subscription client because of this issue:
                // https://github.com/googleapis/nodejs-pubsub/issues/6
                return client.createSubscription(createSubscriptionRequest);
            })
            .then(() => {
                console.log('Topic and subscription were created');
            })
    });

    it('should respect ack deadline', function (done) {
        subscription.on('error', done);
        subscription.on('message', messageHandler);

        topic
            .publisher()
            .publish(Buffer.from(uuid()))
            .catch(done);

        let firstCallTime;
        let secondCallTime;
        function messageHandler() {
            if (!firstCallTime) {
                firstCallTime = Date.now();
                console.log('Message handler first call. Save time and continue');
                return;
            }

            console.log('Message handler second call. Lets do an assertion');

            secondCallTime = Date.now();

            const secondsBetweenCalls = (secondCallTime - firstCallTime) / 1000;

            try {
                assert.ok(secondsBetweenCalls > ackDeadlineSeconds, `The second call ` +
                    `for message handler should be at least after ${ackDeadlineSeconds}, ` +
                    `but got after ${secondsBetweenCalls}`);
                done();
            } catch (error) {
                done(error);
            }
        }
    });

    afterEach(() => {
        subscription.close();

        return Promise.all([
            topic.delete(),
            subscription.delete(),
        ]);
    });
});
