import { promisify } from 'node:util';
import { gzip as _gzip } from 'node:zlib';
import { readFileSync } from 'node:fs';

import morgan from 'morgan';

import { expect } from 'chai';

import {
  createApp
} from '../lib/app.js';

import { fileURLToPath } from 'node:url';

const gzip = promisify(_gzip);

const tlsRptReport = readFileSync(fileURLToPath(new URL('./fixtures/tls-rpt.json', import.meta.url)));

const dmarcReport = readFileSync(fileURLToPath(new URL('./fixtures/dmarc.xml', import.meta.url)));


describe('app', function() {

  let port = 3000;

  /**
   * @type { import('express').Express }
   */
  let server;

  before(function(done) {
    const app = createApp({
      reportsURL: new URL('../tmp/test', import.meta.url),
      log: true
    });

    server = app.listen(port, done);
  });

  after(function(done) {
    server.close(done);
  });

  let baseURL = new URL(`http://localhost:${port}/`);


  describe('tls-rpt', function() {

    it('should accept report', async function() {

      // given
      const report = tlsRptReport;

      // when
      const response = await fetch(new URL('/v1/tls-rpt', baseURL), {
        body: report,
        method: 'POST',
        headers: {
          'content-type': 'application/tlsrpt+json'
        }
      });

      // then
      expect(response.status).to.eql(201);
    });


    it('should accept report (gzip)', async function() {

      // given
      const report = await gzip(tlsRptReport);

      // when
      const response = await fetch(new URL('/v1/tls-rpt', baseURL), {
        body: report,
        method: 'POST',
        headers: {
          'content-type': 'application/tlsrpt+gzip'
        }
      });

      // then
      expect(response.status).to.eql(201);
    });

  });


  describe('dmarc', function() {

    it('should accept report (POST)', async function() {

      // given
      const report = dmarcReport;

      // when
      const response = await fetch(new URL('/v1/dmarc', baseURL), {
        body: report,
        method: 'POST',
        headers: {
          'content-type': 'application/xml'
        }
      });

      // then
      expect(response.status).to.eql(201);
    });


    it('should accept report (PUT)', async function() {

      // given
      const report = dmarcReport;

      // when
      const response = await fetch(new URL('/v1/dmarc', baseURL), {
        body: report,
        method: 'PUT',
        headers: {
          'content-type': 'application/xml'
        }
      });

      // then
      expect(response.status).to.eql(201);
    });


    it('should accept report (gzip)', async function() {

      // given
      const report = await gzip(dmarcReport);

      // when
      const response = await fetch(new URL('/v1/dmarc', baseURL), {
        body: report,
        method: 'POST',
        headers: {
          'content-type': 'application/gzip'
        }
      });

      // then
      expect(response.status).to.eql(201);
    });

  });

});
