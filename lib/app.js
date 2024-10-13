import express from 'express';

import fs from 'node:fs';

import { fileURLToPath } from 'url'
import { URL } from 'node:url';

import morgan from 'morgan';


let count = 0;

/**
 * @typedef { {
 *   'organization-name': string,
 *   'contact-info': string,
 *   'report-id': string,
 *   'date-range': {
 *     'start-datetime': string,
 *     'end-datetime': string
 *   },
 *   policies?: [
 *     {
 *       summary: {
 *         'total-successful-session-count': number,
           'total-failure-session-count': number
 *       },
 *       'policy-domain': string,
 *       'failure-details': string
 *     }
 *   ]
 * } } TLSRPTReport
 */

/**
 * @param  { {
 *   reportsURL?: URL,
 *   log: boolean
 * } } options
 *
 * @return {express.Express}
 */
export function createApp({
  reportsURL = null,
  log = true
}) {

  if (reportsURL) {
    fs.mkdirSync(fileURLToPath(reportsURL), { recursive: true });
  }

  const app = express();

  app.disable("x-powered-by");

  if (log) {
    app.use(morgan('combined'));
  }

  const indexFile = fileURLToPath(new URL('../static/index.html', import.meta.url));

  app.get("/", (req, res) => {
    res.sendFile(indexFile);
  });

  app.post('/v1/tls-rpt', (req, res, next) => {

    if (req.headers['content-type'] === 'application/tlsrpt+gzip') {
      req.headers['content-encoding'] = 'gzip';
      req.headers['content-type'] = 'application/tlsrpt+json';
    }

    next();
  }, express.json({
    type: [
      'application/tlsrpt+json',
      'application/json'
    ],
    inflate: true
  }), (req, res, next) => {
    /**
     * @type { TLSRPTReport }
     */
    const report = req.body;

    const reportPath = fileURLToPath(new URL(`./${Date.now()}-${count++}-tls-rpt-report.json`, reportsURL));
    fs.writeFileSync(reportPath, JSON.stringify(report, 0, 2), 'utf8');

    res.status(201).send();
  });

  for (const method of [ 'post', 'put' ]) {

    app[method]('/v1/dmarc', (req, res, next) => {
      if (req.headers['content-type'] === 'application/gzip') {
        req.headers['content-encoding'] = 'gzip';
        req.headers['content-type'] = 'application/xml';
      }

      next();
    }, express.text({
      type: [
        'application/xml'
      ],
      inflate: true
    }), (req, res, next) => {

      /**
       * @type { string }
       */
      const report = req.body;

      const reportPath = fileURLToPath(new URL(`./${Date.now()}-${count++}-dmarc-report.xml`, reportsURL));
      fs.writeFileSync(reportPath, report, 'utf8');

      res.status(201).send();
    });
  }

  app.use((err, req, res, next) => {
    console.error('ERROR', err.stack);

    res.status(500);
  });

  return app;
}

/*

  const {
    'organization-name': organizationName,
    "contact-info": contactInfo,
    "report-id": reportId,
    "date-range": {
      "start-datetime": startTime,
      "end-datetime": endTime
    },
    policies = []
  } = report;

  for (const policy of policies) {
    const {
      summary: {
        "total-successful-session-count": successCount,
        "total-failure-session-count": failureCount
      },
      "failure-details": failureDetails = [],
      "policy-domain": policyDomain
    } = policy;


    console.log(`${orgName}: Success: ${successCount}, Failure: ${failureCount}.`)

    if (failureDetails && Array.isArray(failureDetails) && failureDetails.length > 0) {
      // There are some failures to report
      const range = {startTime: new Date(dateRange["start-datetime"]), endTime: new Date(dateRange["start-datetime"])}
      reportIssue(req.body, {orgName, reportId, contactInfo, domain: policy.policy["policy-domain"]}, range,
        {successCount, failCount: failureCount}, failureDetails)
    }
  }

 */