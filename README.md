# lambda-megaphone-validator
An AWS lambda function that compares the file sizes of recently uploaded audio files with the original files

## How to publish:

```
$ ./publish.sh
```

## Required environment variables:

In order for this lambda function to work, you need the following environment variables defined:

```
MEGAPHONE_AUTH_TOKEN=
MEGAPHONE_NETWORK_ID=
SCPR_PROGRAM_SLUGS=
```
