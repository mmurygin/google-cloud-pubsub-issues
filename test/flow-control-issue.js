'use strict';

const uuid = require('uuid').v4;
const Pubsub = require('@google-cloud/pubsub');

const pubsub = Pubsub();

function getRandomName() {
    return `test-pubsub-issue-${uuid()}`;
}

describe('broken flow control issue', function () {
    const MAX_MESSAGES = 1;
    const TOTAL_MESSAGES = 10;

    let topic;
    let subscription;
    beforeEach(() => {
        topic = pubsub.topic(getRandomName());
        subscription = topic.subscription(getRandomName(), {
            flowControl: {
                maxMessages: MAX_MESSAGES,
            },
        });

        return topic
            .create()
            .then(() =>  subscription.create())
            .then(() => {
                console.log(`Topic and subscription were created`);
            })
    });

    it('should respect flow control', function (done) {
        const publisher = topic.publisher();
        const PROCESSING_TIME = 30000;

        subscription.on('error', done);
        subscription.on('message', messageHandler);

        let published = 0;
        while (published < TOTAL_MESSAGES) {
            publisher.publish(Buffer.from(uuid()), err => {
                if (err) {
                    done(err);
                }
            });
            published++;
            console.log(`Published ${published} messages`);
        }

        let inWork = 0;
        let processed = 0;
        function messageHandler(message) {
            inWork++;

            console.log(`In work: ${inWork}, Processed: ${processed}`);

            if (inWork > MAX_MESSAGES) {
                done(new Error(`Should process no more than ${MAX_MESSAGES} simultaneously, ` +
                    `but got ${inWork}`))
            }

            setTimeout(() => {
                processed++;
                inWork--;

                console.log(`In work: ${inWork}, Processed: ${processed}`);
                message.ack();

                if (processed === TOTAL_MESSAGES) {
                    done();
                }
            }, PROCESSING_TIME);
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
