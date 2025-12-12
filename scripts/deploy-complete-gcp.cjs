#!/usr/bin/env node

/**
 * GCP Deployment - Complete Schema Migration
 * Sydney SAT Learning Platform
 * Uses direct PostgreSQL connection via Cloud SQL Proxy
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`)
};

const config = {
    projectId: 'project-sidney-prod',
    region: 'us-central1',
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: 'sydney_db',
    dbUser: 'sydney_user',
    dbPassword: 'Sydney2024SecurePass!'
};

async function runCommand(cmd, args, description) {
    return new Promise((resolve, reject) => {
        log.info(description);
        const proc = spawn(cmd, args, { stdio: 'inherit' });
        
        proc.on('close', (code) => {
            if (code === 0) {
                log.success(description);
                resolve(code);
            } else {
                log.error(`${description} (exit code: ${code})`);
                reject(new Error(`Command failed: ${description}`));
            }
        });
    });
}

async function deploy() {
    try {
        console.log(`\n${colors.blue}${'='.repeat(70)}${colors.reset}`);
        console.log(`${colors.blue}   Sydney SAT - GCP Deployment with Full Schema Migration${colors.reset}`);
        console.log(`${colors.blue}${'='.repeat(70)}${colors.reset}\n`);

        // Step 1: Check files exist
        log.info('Checking migration files...');
        const migrationFile = './database/migrations/005_full_schema_complete.sql';
        if (!fs.existsSync(migrationFile)) {
            throw new Error(`Migration file not found: ${migrationFile}`);
        }
        log.success('Migration file found');

        // Step 2: Apply migration using psql
        console.log(`\n${colors.yellow}[Step 1/5] Applying complete schema migration...${colors.reset}`);
        
        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
        
        // Use psql with connection details
        const psqlArgs = [
            '-h', config.dbHost,
            '-p', config.dbPort.toString(),
            '-U', config.dbUser,
            '-d', config.dbName,
            '-f', migrationFile
        ];

        const psqlEnv = {
            ...process.env,
            'PGPASSWORD': config.dbPassword
        };

        return new Promise((resolve, reject) => {
            const proc = spawn('psql', psqlArgs, { 
                env: psqlEnv,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data);
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                // Check for important notices
                if (data.toString().includes('NOTICE')) {
                    process.stderr.write(data);
                }
            });

            proc.on('close', async (code) => {
                if (code === 0) {
                    log.success('Complete schema migration applied');

                    // Step 2: Verify schema
                    console.log(`\n${colors.yellow}[Step 2/5] Verifying schema...${colors.reset}`);
                    
                    const verifyQuery = `
                        SELECT 
                            (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables,
                            (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes
                    `;
                    
                    const verifyArgs = [
                        '-h', config.dbHost,
                        '-p', config.dbPort.toString(),
                        '-U', config.dbUser,
                        '-d', config.dbName,
                        '-t',
                        '-c', verifyQuery
                    ];

                    const verifyProc = spawn('psql', verifyArgs, { env: psqlEnv });
                    let verifyOut = '';

                    verifyProc.stdout.on('data', (data) => {
                        verifyOut += data.toString();
                    });

                    verifyProc.on('close', async (verifyCode) => {
                        if (verifyCode === 0) {
                            log.success('Schema verification complete');
                            console.log(`${colors.blue}${verifyOut}${colors.reset}`);

                            // Step 3-5: Build and deploy
                            try {
                                console.log(`\n${colors.yellow}[Step 3/5] Building Docker images...${colors.reset}`);
                                await runCommand('docker', [
                                    'build',
                                    '-t', `gcr.io/${config.projectId}/sydney-backend:latest`,
                                    'backend'
                                ], 'Building backend image');

                                await runCommand('docker', [
                                    'build',
                                    '-t', `gcr.io/${config.projectId}/sydney-frontend:latest`,
                                    '.'
                                ], 'Building frontend image');

                                console.log(`\n${colors.yellow}[Step 4/5] Pushing to Google Container Registry...${colors.reset}`);
                                await runCommand('docker', [
                                    'push',
                                    `gcr.io/${config.projectId}/sydney-backend:latest`
                                ], 'Pushing backend image');

                                await runCommand('docker', [
                                    'push',
                                    `gcr.io/${config.projectId}/sydney-frontend:latest`
                                ], 'Pushing frontend image');

                                console.log(`\n${colors.yellow}[Step 5/5] Deploying to Cloud Run...${colors.reset}`);
                                
                                // Get backend URL for frontend env var
                                const backendUrlProc = spawn('gcloud', [
                                    'run', 'services', 'describe', 'sydney-backend',
                                    '--region', config.region,
                                    '--format', 'value(status.url)'
                                ]);

                                let backendUrl = '';
                                backendUrlProc.stdout.on('data', (data) => {
                                    backendUrl += data.toString().trim();
                                });

                                backendUrlProc.on('close', async () => {
                                    try {
                                        const jwtSecret = require('crypto').randomBytes(64).toString('base64');

                                        await runCommand('gcloud', [
                                            'run', 'deploy', 'sydney-backend',
                                            `--image=gcr.io/${config.projectId}/sydney-backend:latest`,
                                            '--platform=managed',
                                            `--region=${config.region}`,
                                            '--port=3000',
                                            '--memory=1Gi',
                                            '--cpu=1',
                                            '--min-instances=0',
                                            '--max-instances=10',
                                            '--timeout=300',
                                            `--add-cloudsql-instances=${config.projectId}:${config.region}:sydney-postgres`,
                                            `--set-env-vars=NODE_ENV=production,DATABASE_URL=postgresql://${config.dbUser}:${config.dbPassword}@localhost/sydney_db?host=/cloudsql/${config.projectId}:${config.region}:sydney-postgres,JWT_SECRET=${jwtSecret}`,
                                            '--no-allow-unauthenticated',
                                            '--quiet'
                                        ], 'Deploying backend to Cloud Run');

                                        await runCommand('gcloud', [
                                            'run', 'deploy', 'sydney-frontend',
                                            `--image=gcr.io/${config.projectId}/sydney-frontend:latest`,
                                            '--platform=managed',
                                            `--region=${config.region}`,
                                            '--port=80',
                                            '--memory=512Mi',
                                            '--cpu=1',
                                            '--min-instances=0',
                                            '--max-instances=10',
                                            '--timeout=60',
                                            `--set-env-vars=VITE_API_URL=https://sydney-backend-504880375460.${config.region}.run.app`,
                                            '--no-allow-unauthenticated',
                                            '--quiet'
                                        ], 'Deploying frontend to Cloud Run');

                                        console.log(`\n${colors.green}${'='.repeat(70)}${colors.reset}`);
                                        console.log(`${colors.green}✅ DEPLOYMENT COMPLETED SUCCESSFULLY!${colors.reset}`);
                                        console.log(`${colors.green}${'='.repeat(70)}${colors.reset}`);

                                        console.log(`\n${colors.yellow}⚠️  Make Services Publicly Accessible:${colors.reset}`);
                                        console.log(`\n${colors.blue}Run these commands:${colors.reset}`);
                                        console.log(`  ${colors.green}gcloud run services add-iam-policy-binding sydney-backend --region=${config.region} --member=allUsers --role=roles/run.invoker${colors.reset}`);
                                        console.log(`  ${colors.green}gcloud run services add-iam-policy-binding sydney-frontend --region=${config.region} --member=allUsers --role=roles/run.invoker${colors.reset}`);

                                        resolve(0);
                                    } catch (err) {
                                        console.error(`${colors.red}Deployment failed: ${err.message}${colors.reset}`);
                                        reject(err);
                                    }
                                });
                            } catch (err) {
                                console.error(`${colors.red}Build/Deploy failed: ${err.message}${colors.reset}`);
                                reject(err);
                            }
                        } else {
                            throw new Error('Schema verification failed');
                        }
                    });
                } else {
                    log.error(`Migration failed with exit code ${code}`);
                    if (stderr) console.error(stderr);
                    reject(new Error('Migration failed'));
                }
            });
        });

    } catch (err) {
        console.error(`\n${colors.red}❌ Deployment failed: ${err.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run deployment
deploy().then(() => {
    console.log(`\n${colors.blue}Done!${colors.reset}`);
    process.exit(0);
}).catch(err => {
    console.error(`\n${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
});
