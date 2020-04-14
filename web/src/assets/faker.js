var faker = require('faker');

let builds = [];

const artifactStates = ['Finished'];
const artifactKinds = ['IPA', 'APK', 'DMG'];
const artifactDrivers = ['Buildkite'];
const artifactMimeTypes = ['application/octet-stream'];
const buildStates = ['Passed'];

const getUrls = (artifactUrl) => ({
  dl_artifact_signed_url: `${artifactUrl}?sign=${alphaNumeric(40)}`,
  plist_signed_url: `${artifactUrl}.plist?sign=${alphaNumeric(40)}`,
});

const newArtifactUrl = () =>
  `/api/artifact-${alphaNumeric({
    min: 2,
    max: 4,
  })}/${arrayElement(artifactDrivers)}/${faker.random.uuid()}`;

const {
  random: {arrayElement, alphaNumeric},
  lorem: {slug},
} = faker;

const artifact = (
  {creationDate, driver} = {creationDate: new Date(), driver: 'Buildkite'}
) => ({
  id: `${driver.toLowerCase()}_${faker.lorem.slug()}`,
  created_at: creationDate.toISOString(),
  file_size: `${faker.random.number({min: 1234567, max: 12345678})}`,
  local_path: `js/packages/${slug()}/${slug(10)}.ipa`,
  download_url: `https://api.${driver.toLowerCase()}.com/v2/organizations/org/suborg/division/${faker.random.number(
    {min: 0, max: 10}
  )}/${faker.random.word()}/${faker.random.uuid()}/download`,
  mime_type: `${arrayElement(artifactMimeTypes)}`,
  state: `${arrayElement(artifactStates)}`,
  kind: `${arrayElement(artifactKinds)}`,
  driver: `${arrayElement(artifactDrivers)}`,
  ...getUrls(newArtifactUrl()),
});

for (let i = 0; i < 10; i++) {
  // stagger build times
  let creationDate = new Date();
  creationDate.setHours(creationDate.getHours() - (i + 1 * 6));
  let startDate = new Date(creationDate);
  startDate.setHours(creationDate.getHours() + 1);
  let finishDate = new Date(creationDate);
  finishDate.setHours(creationDate.getHours() + 3);

  const driver = arrayElement(artifactDrivers);

  builds = builds.concat({
    id: `${faker.internet.url()}/org/project/meta/builds/${faker.random.alphaNumeric(
      20
    )}`,
    created_at: creationDate.toISOString(),
    state: `${arrayElement(buildStates)}`,
    message: `${faker.lorem.sentence(10, 3)}`,
    started_at: startDate.toISOString(),
    finished_at: finishDate.toISOString(),
    commit: `${alphaNumeric(40)}`,
    branch: `${alphaNumeric(5)}:${alphaNumeric(5)}/${faker.lorem.slug()}}`,
    driver,
    has_artifacts: new Array(faker.random.number(5))
      .fill(0)
      .map(() => artifact({creationDate, driver})),
  });
}

export const response = {status: 200, statusText: 'OK', data: {builds}};
