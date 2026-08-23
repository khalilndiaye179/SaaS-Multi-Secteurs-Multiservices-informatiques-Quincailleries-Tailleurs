# Ce script permet de contourner le caractère "&" dans le chemin du projet qui casse les shims .cmd générés par npm sous Windows.
param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$CommandName,

    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$CommandArgs
)

switch ($CommandName) {
    "test" {
        node ./node_modules/jest/bin/jest.js --config ./test/jest-e2e.json
    }
    "security" {
        node ./node_modules/jest/bin/jest.js --config ./test/jest-e2e.json --testPathPattern=tenant-isolation.e2e-spec.ts
    }
    "prisma" {
        node ./node_modules/prisma/build/index.js @CommandArgs
    }
    "build" {
        node ./node_modules/@nestjs/cli/bin/nest.js build
    }
    default {
        Write-Host "Commande non reconnue: $CommandName" -ForegroundColor Red
        Write-Host "Commandes disponibles: test, security, prisma, build"
    }
}
