import React from "react";

function TermsAndConditionsContent({ className = "" }) {
  return (
    <div className={className}>
      <p>
        Welcome to Matflow! These terms and conditions outline the rules and
        regulations for the use of our website.
      </p>
      <p>
        By accessing this website, we assume you accept these terms and
        conditions. Do not continue to use Matflow if you do not agree to all
        of the terms and conditions stated on this page.
      </p>

      <h3 className="font-semibold text-gray-900 text-base pt-2">License</h3>
      <p>
        Unless otherwise stated, Matflow and/or its licensors own the
        intellectual property rights for all material on Matflow. All
        intellectual property rights are reserved. You may access this from
        Matflow for your own personal use subjected to restrictions set in
        these terms and conditions.
      </p>
      <p>You must not:</p>
      <ul className="list-disc list-inside space-y-1.5 ml-2 text-gray-600">
        <li>Republish material from Matflow</li>
        <li>Sell, rent or sub-license material from Matflow</li>
        <li>Reproduce, duplicate or copy material from Matflow</li>
        <li>Redistribute content from Matflow</li>
      </ul>

      <h3 className="font-semibold text-gray-900 text-base pt-2">
        User Content
      </h3>
      <p>
        In these terms and conditions, &ldquo;your user content&rdquo; means
        material (including without limitation text, images, audio material,
        video material, and audio-visual material) that you submit to this
        website, for whatever purpose.
      </p>
      <p>
        You grant to Matflow a worldwide, irrevocable, non-exclusive,
        royalty-free license to use, reproduce, adapt, publish, translate and
        distribute your user content in any existing or future media. You also
        grant to Matflow the right to sub-license these rights, and the right
        to bring an action for infringement of these rights.
      </p>
    </div>
  );
}

export default TermsAndConditionsContent;
