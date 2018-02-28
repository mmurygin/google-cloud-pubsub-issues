# This repo shows @google-cloud/pubsub issues

## Getting started

1. Install dependencies

    ```bash
    npm install
    ```

1. Run tests

    ```bash
    GOOGLE_PROJECT=your-project-id GOOGLE_APPLICATION_CREDENTIALS=path-to-credentials npm test
    ```

## Flow control issue

    GOOGLE_PROJECT=your-project-id GOOGLE_APPLICATION_CREDENTIALS=path-to-credentials npm run flow-control

## Ack Deadline issue

    GOOGLE_PROJECT=your-project-id GOOGLE_APPLICATION_CREDENTIALS=path-to-credentials npm run ack-deadline
