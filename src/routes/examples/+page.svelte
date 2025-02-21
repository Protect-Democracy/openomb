<script lang="ts">
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
  import SearchSubscribe from '$components/subscriptions/SearchSubscribe.svelte';

  export let data: PageData;

  // Stores
  const url = derived(page, ($page) => $page.url);
</script>

<svelte:head>
  <meta name="robots" content="noindex,follow" />
</svelte:head>

<div class="page-container content-container">
  <h2>Examples</h2>

  <ul>
    <li><a href="/file/11221129">11221129 - Most schedule items</a></li>
    <li><a href="/file/11297405">11297405 - 2nd Most schedule items</a></li>
    <li><a href="/file/11297388">11297388 - ~400 schedule items</a></li>
    <li><a href="/file/11316019">11316019 - ~100 schedule items</a></li>
    <li><a href="/file/pdf-4e735d84cd39d97c04f83f737d61feae">PDF example</a></li>
    <li><a href="/file/11195820">11195820 - Example with a 6180 line</a></li>
    <li><a href="/file/11299636">11299636 - Example with a 6181 line</a></li>
    <li>
      <a href="/file/11209228">11209228 - Example with a 6180 line and an amount (only one)</a>
    </li>
  </ul>

  <h2>Recent files</h2>
  <ul>
    {#each data.recentlyApproved as file}
      <li>
        <a href="/file/{file.fileId}">{file.folder} - {file.fileId} - {file.approvalTimestamp}</a>
      </li>
    {/each}
  </ul>

  <h2>Recently removed</h2>

  <p>(if there is any)</p>

  <ul>
    {#each data.recentlyRemoved as file}
      <li>
        <a href="/file/{file.fileId}">{file.folder} - {file.fileId} - {file.approvalTimestamp}</a>
      </li>
    {/each}
  </ul>

  <h2>Folders</h2>

  <p>
    Is there a better name than folder? Maybe we make landing pages for each Folder to help with
    exploration and SEO?
  </p>

  <ul>
    {#each data.folders as folder}
      <li><a href="/folder/{folder.folderId}">{folder.folder}</a> ({folder.fileCount})</li>
    {/each}
  </ul>

  <h2>Approvers</h2>

  <p>Each approver.</p>

  <ul>
    {#each data.approvers as approver}
      <li>{approver.approverTitle || 'null'} ({approver.count})</li>
    {/each}
  </ul>

  <h2>Subscriptions</h2>
  <h3>Folders</h3>
  <p>
    <SubscribeLink
      user={data.user}
      subType="folder"
      subItemId="department-of-education"
      subItemFormatted="Department of Education"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == 'department-of-education'
      )}
      overrideFeatureFlag
    />
  </p>
  <p>
    <SubscribeLink
      user={data.user}
      subType="folder"
      subItemId="international-assistance-programs"
      subItemFormatted="International Assistance Programs"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == 'international-assistance-programs'
      )}
      overrideFeatureFlag
    />
  </p>

  <h3>Agencies</h3>
  <p>
    <SubscribeLink
      user={data.user}
      subType="agency"
      subItemId="department-of-defense-military-programs"
      subItemFormatted="Department of Defense Military Programs"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == 'department-of-defense-military-programs'
      )}
      overrideFeatureFlag
    />
  </p>
  <p>
    <SubscribeLink
      user={data.user}
      subType="agency"
      subItemId="securities-and-exchange-commission"
      subItemFormatted="Securities and Exchange Commission"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == 'securities-and-exchange-commission'
      )}
      overrideFeatureFlag
    />
  </p>

  <h3>Bureaus</h3>
  <p>
    <SubscribeLink
      user={data.user}
      subType="bureau"
      subItemId="national-science-foundation,national-science-foundation"
      subItemFormatted="National Science Foundation"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == 'national-science-foundation,national-science-foundation'
      )}
      overrideFeatureFlag
    />
  </p>
  <p>
    <SubscribeLink
      user={data.user}
      subType="bureau"
      subItemId="department-of-transportation,federal-highway-administration"
      subItemFormatted="Federal Highway Administration"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == 'department-of-transportation,federal-highway-administration'
      )}
      overrideFeatureFlag
    />
  </p>

  <h3>Accounts</h3>
  <p>
    <SubscribeLink
      user={data.user}
      subType="account"
      subItemId="executive-office-of-the-president,office-of-administration,executive-office-of-the-president"
      subItemFormatted="Executive Office of the President"
      existingSubscription={data.existingSubscriptions.find(
        (sub) =>
          sub.itemId ==
          'executive-office-of-the-president,office-of-administration,executive-office-of-the-president'
      )}
      overrideFeatureFlag
    />
  </p>
  <p>
    <SubscribeLink
      user={data.user}
      subType="account"
      subItemId="social-security-administration,social-security-administration,supplemental-security-income-program"
      subItemFormatted="Supplemental Security Income Program"
      existingSubscription={data.existingSubscriptions.find(
        (sub) =>
          sub.itemId ==
          'social-security-administration,social-security-administration,supplemental-security-income-program'
      )}
      overrideFeatureFlag
    />
  </p>

  <h3>TAFS</h3>
  <p>
    <SubscribeLink
      user={data.user}
      subType="tafs"
      subItemId="11409026--011-0041--1--2025"
      subItemFormatted="011-0041 /X - United States DOGE Service"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == '11409026--011-0041--1--2025'
      )}
      overrideFeatureFlag
    />
  </p>
  <p>
    <SubscribeLink
      user={data.user}
      subType="tafs"
      subItemId="11408172--091-0202-2024-2025--3--2025"
      subItemFormatted="091-0202 2024/2025 - Student Aid Administration"
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemId == '11408172--091-0202-2024-2025--3--2025'
      )}
      overrideFeatureFlag
    />
  </p>

  <h3>Searches</h3>
  <p>
    <SearchSubscribe
      user={data.user}
      url={new URL(
        '/search?term=farm&agencyBureau=&tafs=&account=&approver=&approvedStart=&approvedEnd=&lineNum=budgetary-resources%2C1011&footnoteNum=B',
        $url.origin
      )}
      existingSubscription={data.existingSubscriptions.find(
        (sub) => sub.itemDetails?.criterion?.term == 'farm'
      )}
      overrideFeatureFlag
    />
  </p>
  <p>
    <SearchSubscribe
      user={data.user}
      url={new URL(
        '/search?term=&agencyBureau=&tafs=&account=&approver=acting-deputy-associate-director-for-international-affairs-programs&approvedStart=&approvedEnd=&lineNum=budgetary-resources%2C1011&footnoteNum=B',
        $url.origin
      )}
      existingSubscription={data.existingSubscriptions.find(
        (sub) =>
          sub.itemDetails?.criterion?.approver ==
          'acting-deputy-associate-director-for-international-affairs-programs'
      )}
      overrideFeatureFlag
    />
  </p>

  <!--
<h2>Folder, Agency, Bureau</h2>

<p>A breakdown by Folder, Agency, and Bureau with a file count next to each one.</p>

<ul>
  {#each data.departmentAgencyBureau as folder}
    <li>
      {folder.folder}
      {#if folder.rows.length}
        <ul>
          {#each folder.rows as agency}
            <li>
              {agency.agency}
              {#if agency.rows.length}
                <ul>
                  {#each agency.rows as bureau}
                    <li>
                      {bureau.bureau} ({bureau.fileCount})
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </li>
  {/each}
</ul>

-->

  <h2>Styles</h2>
  <a href="/styles">Page with many elements to help with global style development</a>
</div>
