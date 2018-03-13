'use strict';

const uuid = require('uuid').v4;
const pubsub = require('@google-cloud/pubsub')();
const sinon = require('sinon');

function getRandomName() {
    return `test-pubsub-issue-${uuid()}`;
}

describe('lease message issue', () => {
    let topic;
    let subscription;
    beforeEach(() => {
        topic = pubsub.topic(getRandomName());
        subscription = topic.subscription(getRandomName());

        return topic
            .create()
            .then(() =>  subscription.create());
    });

    it('should not redeliver message until subscription is closed', function (done) {
        subscription.on('error', error => {
            console.error(error);
        });

        const onMessage = sinon.spy();
        subscription.on('message', onMessage);

        topic
            .publisher()
            .publish(Buffer.from(uuid()))
            .catch(done);

        setTimeout(() => {
            try {
                sinon.assert.calledOnce(onMessage);
                done();
            } catch (error) {
                done(error);
            }
        }, 120000);
    });

    afterEach(() => {
        subscription.close();

        return Promise.all([
            topic.delete(),
            subscription.delete(),
        ]);
    });
});
