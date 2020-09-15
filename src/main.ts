import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    for (const pr of pullRequests) {
      core.info(`title ${pr.title}`)

      const prRequestedReponse = await octokit.graphql(
        `
        query($owner: String!, $name: String!, $number: Int!) {
          repository(owner: $owner, name: $name) {
            pullRequest(number: $number) {
              timelineItems(first: 20, itemTypes: [REVIEW_REQUESTED_EVENT]) {
                nodes {
                  __typename
                  ... on ReviewRequestedEvent {
                    createdAt
                  }
                }
              }
            }
          }
        }
        `,
        {
          owner: github.context.repo.owner,
          name: github.context.repo.repo,
          number: pr.number
        }
      )

      const currentTime = new Date().getTime()
      const response = prRequestedReponse as PrRequestedResponse
      const node = response.repository.pullRequest.timelineItems.nodes[0]

      core.debug(`node before`)
      core.debug(`node ${node}`)
      core.debug(`node c ${node?.createdAt}`)

      if (node?.createdAt == null) {
        continue
      }

      core.debug(`review request time ${node.createdAt}`)

      const pullRequestCreatedTime =
        new Date(node.createdAt).getTime() + 60 * 60 * 24

      core.debug(`${currentTime} > ${pullRequestCreatedTime}`)

      if (currentTime > pullRequestCreatedTime) {
        continue
      }

      core.debug(`check review`)
      const {data: pullRequest} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      core.debug(`review commented ${pullRequest.review_comments}`)
      if (pullRequest.review_comments !== 0) {
        continue
      }

      const reviewers = pullRequest.requested_reviewers
        .map(rr => `@${rr.login}`)
        .join(', ')

      await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: `${reviewers} \nレビュー開始から1営業日経過しました。レビューをなるべく優先しましょう。`
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

interface PrRequestedResponse {
  repository: {
    pullRequest: {
      timelineItems: {
        nodes: [
          {
            __typename?: string
            createdAt?: string
          }
        ]
      }
    }
  }
}

run()
