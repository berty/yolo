export const results = {
  data: {
    builds: [
      {
        id: 'https://fakeCiPlatform.com/org/project/meta/builds/0',
        created_at: '2020-04-09T15:21:57.904Z',
        state: 'Passed',
        message: 'Updated something and it is cool',
        started_at: '2020-04-09T15:23:00Z',
        finished_at: '2020-04-09T15:37:30Z',
        commit: 'looooooooonghaaashstring',
        branch: 'user0:meta/feature',
        driver: 'fakeCiPlatform',
        has_artifacts: [
          {
            id: 'fakeCiPlatform_01234567890abcdef-0',
            created_at: '2020-04-09T15:21:57.904Z',
            file_size: '37558223',
            local_path:
              'js/packages/i-am-a-path/i-am-really-long-long-long-10.ipa',
            download_url:
              'https://api.fakeCiPlatform.com/v2/organizations/org/suborg/division/1234/jobs/faba294a-c24b-4b0f-911e-72e9bed9e824/artifacts/some-identifier1/download',
            mime_type: 'application/octet-stream',
            state: 'Finished',
            kind: 'IPA',
            driver: 'fakeCiPlatform',
            dl_artifact_signed_url:
              '/api/artifact-dl/fakeCiPlatform_hashhashhashashhash?sign=morealphanumericstuff0',
            plist_signed_url:
              '%2api%2plist%2path%2hashhashhashhash%2hashymchash0123456789abcdef0',
          },
        ],
      },
      {
        id: 'https://fakeCiPlatform.com/org/project/meta/builds/1',
        created_at: '2020-04-09T06:37:17.318Z',
        state: 'Passed',
        message: 'Merged pull request #12345',
        started_at: '2020-04-09T06:37:21Z',
        finished_at: '2020-04-09T06:49:52Z',
        commit: 'looooooooonghaaashstring2',
        branch: 'master',
        driver: 'fakeCiPlatform',
        has_artifacts: [
          {
            id: 'fakeCiPlatform_01234567890abcdef-1',
            created_at: '2020-04-09T06:37:17.318Z',
            file_size: '35956974',
            local_path:
              'js/packages/i-am-a-path/i-am-really-long-long-long-1.ipa',
            download_url:
              'https://api.fakeCiPlatform.com/v2/organizations/org/suborg/division/1234/jobs/faba294a-c24b-4b0f-911e-72e9bed9e824/artifacts/some-identifier1/download',
            mime_type: 'application/octet-stream',
            state: 'Finished',
            kind: 'IPA',
            driver: 'fakeCiPlatform',
            dl_artifact_signed_url:
              '/api/artifact-dl/fakeCiPlatform_hashhashhashashhash?sign=morealphanumericstuff1',
            plist_signed_url:
              '%2api%2plist%2path%2hashhashhashhash%2hashymchash0123456789abcdef1',
          },
        ],
      },
      {
        id: 'https://fakeCiPlatform.com/org/project/meta/builds/2',
        created_at: '2020-04-09T06:37:17.318Z',
        state: 'Passed',
        message: 'Merged pull request #1234',
        started_at: '2020-04-09T06:37:21Z',
        finished_at: '2020-04-09T06:49:52Z',
        commit: 'looooooooonghaaashstring',
        branch: 'master',
        driver: 'fakeCiPlatform',
        has_artifacts: [
          {
            id: 'fakeCiPlatform_01234567890abcdef-2',
            created_at: '2020-04-09T06:37:17.318Z',
            file_size: '35956974',
            local_path:
              'js/packages/i-am-a-path/i-am-really-long-long-long-2.ipa',
            download_url:
              'https://api.fakeCiPlatform.com/v2/organizations/org/suborg/division/1234/jobs/faba294a-c24b-4b0f-911e-72e9bed9e824/artifacts/some-identifier2/download',
            mime_type: 'application/octet-stream',
            state: 'Finished',
            kind: 'IPA',
            driver: 'fakeCiPlatform',
            dl_artifact_signed_url:
              '/api/artifact-dl/fakeCiPlatform_hashhashhashashhash?sign=morealphanumericstuff2',
            plist_signed_url:
              '%2api%2plist%2path%2hashhashhashhash%2hashymchash0123456789abcdef2',
          },
        ],
      },
    ],
  },
};
