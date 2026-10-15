# Internal storage project

Owner: Platform Engineering

This project provisions one Azure storage account (`Microsoft.Storage/storageAccounts`).

## Getting started

From this directory, run `azd auth login`, then `azd up`. The configuration is
`azure.yaml` and the infrastructure is `infra/main.bicep`. There is no application
code to deploy.

## Cleanup

Run `azd down` from this directory to remove the provisioned Azure resources.
